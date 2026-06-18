import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contactSchema } from '@/modules/supplier/helpers/schemas';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

type ContactFormProps = {
  onAddContact?: (contact: ContactForm) => void;
  onUpdateContact?: (contact: ContactForm) => void;
  isEdit: boolean;
  initialValues?: ContactForm;
};

export const ContactForm = ({
  onAddContact,
  onUpdateContact,
  isEdit,
  initialValues
}: ContactFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: ''
    },
    resolver: yupResolver<ContactForm>(contactSchema),
    mode: 'onChange'
  });

  const onSubmit = (data: ContactForm) => {
    if (isEdit) {
      onUpdateContact?.({ ...data, id: initialValues?.id });
    } else {
      onAddContact?.(data);
    }
    if (!isEdit) {
      reset(); // Solo resetea si estamos agregando un nuevo contacto
    }
  };

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        notes: ''
      });
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="nombre" className="text-left max-w-[62px] w-full">
          Nombre
        </Label>
        <div className="flex flex-col gap-2 w-full">
          <Input type="text" id="nombre" {...register('name')} className="col-span-3" />
          {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
        </div>
      </div>

      <div className="flex gap-4 w-full">
        <div className="flex items-center gap-2 flex-1">
          <Label htmlFor="telefono" className="text-left w-[62px] flex-shrink-0">
            Teléfono
          </Label>
          <div className="flex flex-col gap-2 w-full">
            <Input type="tel" id="telefono" {...register('phone')} className="flex-grow" />
            {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Label htmlFor="correo" className="text-left flex-shrink-0">
            Correo
          </Label>
          <div className="flex flex-col gap-2 w-full">
            <Input type="email" id="correo" {...register('email')} className="flex-grow" />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="notas" className="text-left max-w-[62px] w-full">
          Notas
        </Label>
        <div className="flex flex-col gap-2 w-full">
          <Input type="text" id="notas" {...register('notes')} className="col-span-3" />
          {errors.notes && <span className="text-red-500 text-xs">{errors.notes.message}</span>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="mt-2 2xl:mt-4">
          {isEdit ? 'Actualizar Contacto' : 'Agregar Contacto'}
        </Button>
      </div>
    </form>
  );
};
