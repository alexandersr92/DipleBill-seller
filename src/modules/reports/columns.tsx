import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { IReport, reportTypeTranslations } from './types';
import { deleteReport, downloadReport } from './services/reportsThunks';

const ActionCell = ({ report }: { report: IReport }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      await dispatch(downloadReport({ id: report.id, name: report.name })).unwrap();
    } catch {
      toast({
        title: 'Error de descarga',
        description: 'No se pudo descargar el reporte.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Está seguro de que desea eliminar este reporte?')) {
      try {
        await dispatch(deleteReport(report.id)).unwrap();
        toast({
          title: 'Reporte eliminado',
          description: 'El reporte ha sido eliminado permanentemente.',
          variant: 'default'
        });
      } catch {
        toast({
          title: 'Error al eliminar',
          description: 'Hubo un error al intentar eliminar el reporte.',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handleDownload} title="Descargar PDF">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="destructive" size="icon" onClick={handleDelete} title="Eliminar Reporte">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const columns: ColumnDef<IReport>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre del Reporte'
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const translated = reportTypeTranslations[type] || type;
      return <span className="capitalize">{translated}</span>;
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha de Creación',
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      if (!date) return '-';
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    }
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
          {status === 'completed' ? 'Completado' : 'Pendiente'}
        </Badge>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionCell report={row.original} />
  }
];
