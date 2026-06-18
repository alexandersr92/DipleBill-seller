import { Skeleton } from '@/components/ui/skeleton';

const InvoiceSkeleton = () => {
  return (
    <section>
      <section className="rounded-md shadow-sm p-4 border mb-4">
        <div className="w-1/5 text-sm pb-2 border-0 border-b">
          <Skeleton className="h-8" />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="w-full flex flex-wrap">
            <label className="text-sm mb-1 w-full" htmlFor="">
              Cliente
            </label>
            <Skeleton className="h-10 w-full border-gray-500" />
          </div>

          <div className="w-full flex flex-wrap">
            <label className="text-sm mb-1 w-full" htmlFor="">
              Fecha de la factura
            </label>
            <Skeleton className="h-10 w-full border-gray-500" />
          </div>

          <div className="w-full">
            <label className="text-sm mb-1" htmlFor="">
              Tipo de venta
            </label>
            <Skeleton className="h-10 border-gray-500" />
          </div>

          <div className="w-full">
            <label className="text-sm mb-1" htmlFor="">
              Fecha de vencimiento
            </label>
            <Skeleton className="h-10 border-gray-500" />
          </div>

          <div className="w-full">
            <label className="text-sm mb-1" htmlFor="">
              Vendedor
            </label>
            <Skeleton className="h-10 border-gray-500" />
          </div>
          <div className="w-full">
            <label className="text-sm mb-1" htmlFor="">
              Metodo de pago
            </label>
            <Skeleton className="h-10 border-gray-500" />
          </div>

          <div className="w-full xl:col-span-1 sm:col-span-2 flex gap-2 flex-wrap items-start flex-col">
            <label className="text-sm mb-1" htmlFor="">
              Detalles de la factura
            </label>
            <Skeleton className="h-20 w-full border-gray-500" />
          </div>
        </div>
      </section>

      <div className="mt-4">
        <Skeleton className="w-full h-32" />
      </div>

      <div className="pt-4 w-full flex justify-end gap-3 items-center">
        <Skeleton className="w-48 h-12" />
      </div>
    </section>
  );
};

export default InvoiceSkeleton;
