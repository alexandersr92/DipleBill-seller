import { Skeleton } from '@/components/ui/skeleton';

export default function FormSkeleton() {
  return (
    <div className=" w-11/12 flex flex-col gap-4">
      <Skeleton className="h-8 w-full rounded" />

      <Skeleton className="h-20 w-full rounded" />

      <Skeleton className="h-8 w-full rounded" />
    </div>
  );
}
