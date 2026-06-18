import { Skeleton } from '@/components/ui/skeleton';

const InventoryCardSkeleton = () => {
  return (
    <div className="min-w-full hover:shadow-lg transition-shadow duration-200 min-h-40 border rounded-lg py-7 px-7 w-96">
      <div className="flex flex-row items-center justify-between">
        <Skeleton className="text-sm font-medium h-4 w-[250px]" />
        <Skeleton className="h-8 w-8 p-0" />
      </div>
      <div className="w-full">
        <Skeleton className="text-xs text-muted-foreground flex gap-1 w-4/5 h-3" />
        <Skeleton className="text-2xl font-bold mt-4 w-3/6 h-6" />
      </div>
      <div className="w-full mt-10">
        <Skeleton className="w-full text-sm h-10" />
      </div>
    </div>
  );
};

export default InventoryCardSkeleton;
