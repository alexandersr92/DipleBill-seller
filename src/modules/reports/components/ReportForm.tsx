import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import { generateReport, getReports, getReportTypes } from '../services/reportsThunks';
import { IGenerateReportPayload, reportTypeTranslations } from '../types';

interface ReportFormProps {
  onSuccess: () => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const reportTypes = useAppSelector((state) => state.reportsSlice?.reportTypes || []);
  const isGenerating = useAppSelector((state) => state.reportsSlice?.isGenerating || false);
  const storeId = useAppSelector((state) => state.storeSlice.store?.id);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<IGenerateReportPayload>({
    defaultValues: {
      type: '',
      date_from: '',
      date_to: ''
    }
  });

  useEffect(() => {
    dispatch(getReportTypes());
  }, [dispatch]);

  const onSubmit = async (data: IGenerateReportPayload) => {
    try {
      await dispatch(generateReport({ ...data, store_id: storeId })).unwrap();
      toast({
        title: 'Reporte generado',
        description: 'El reporte se ha generado correctamente.',
        variant: 'default'
      });
      dispatch(getReports({ page: 1, pageSize: 10, store_id: storeId }));
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Hubo un error al generar el reporte';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Reporte *</Label>
        <Controller
          name="type"
          control={control}
          rules={{ required: 'Debe seleccionar un tipo de reporte' }}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {reportTypeTranslations[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <span className="text-red-500 text-sm">{errors.type.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label htmlFor="date_from">Desde (Opcional)</Label>
          <Controller
            name="date_from"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="date_from"
                value={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
              />
            )}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label htmlFor="date_to">Hasta (Opcional)</Label>
          <Controller
            name="date_to"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="date_to"
                value={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
              />
            )}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            'Generar Reporte'
          )}
        </Button>
      </div>
    </form>
  );
}
