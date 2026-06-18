import { Skeleton } from '@/components/ui/skeleton';

export default function LayoutSkeleton() {
  return (
    <div className="grid grid-cols-1 grid-rows-[80px_1fr] gap-4 text-[14px] 2xl:text-lg min-h-screen h-screen">
      {/* Skeleton for TopBar */}
      <Skeleton className="h-[80px] w-full" />

      {/* Main content with Sidebar and Body Skeletons */}
      <div className={`grid ${'grid-cols-[300px_1fr] ml-4'} gap-4 transition-all`}>
        {/* Skeleton for Sidebar */}
        <Skeleton className="h-full w-[300px]" />

        <div className="w-full h-full row-span-2 grid grid-rows-[1fr_70px] px-4 pt-4">
          {/* Skeleton for main content area */}
          <Skeleton className="w-full h-full row-span-1" />

          {/* Skeleton for Footer */}
          <Skeleton className="h-[70px] w-full" />
        </div>
      </div>
    </div>
  );
}
