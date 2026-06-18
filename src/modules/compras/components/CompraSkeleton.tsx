import { Skeleton } from '../../../components/ui/skeleton';

export default function CompraSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <section className="rounded-md shadow-md p-4 border mb-4">
        <div className="w-2/5">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="w-full flex flex-wrap">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}

          <div className="w-full flex gap-2">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </section>

      <section className="rounded-md shadow-md p-4 border">
        <Skeleton className="h-24 w-full mb-4" />

        <div className="border-t pt-4 w-full flex justify-end gap-3 items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </section>
    </div>
  );
}
