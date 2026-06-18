import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows: number;
  columns: number;
}

export function TableSkeleton({ rows, columns }: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      <div className="border-b">
        {/* Header */}
        <div className="flex">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} className="h-4 w-full m-3" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-full m-[20px]" />
          ))}
        </div>
      ))}
    </div>
  );
}
