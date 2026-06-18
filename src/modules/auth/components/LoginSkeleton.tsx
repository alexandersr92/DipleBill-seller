import { Skeleton } from '../../../components/ui/skeleton';

export default function LoginSkeleton() {
  return (
    <div className="grid grid-cols-1 grid-rows-[80px_1fr] gap-4 text-[14px] 2xl:text-lg min-h-screen h-screen">
      {/* Skeleton for TopBar */}
      <Skeleton className="h-[80px] w-full" />

      {/* Main content with image and form skeletons */}
      <div className={`grid ${'grid-cols-[1fr,1fr]'} gap-4 px-4 pt-4`}>
        {/* Skeleton for Image (left side) */}
        <Skeleton className="w-full h-full" />

        <div className="w-full h-full grid grid-rows-[1fr_70px]">
          {/* Skeleton for form content */}
          <div className="flex flex-col justify-center items-center">
            <div className="flex flex-col space-y-4 w-full max-w-[400px]">
              {/* Skeleton for title and description */}
              <Skeleton className="w-full h-[40px]" />
              <Skeleton className="w-full h-[20px]" />

              {/* Skeleton for form fields */}
              <div className="space-y-4">
                <Skeleton className="w-full h-[50px]" />
                <Skeleton className="w-full h-[50px]" />
              </div>

              {/* Skeleton for submit button */}
              <Skeleton className="w-full h-[50px]" />

              {/* Skeleton for link (optional) */}
              <Skeleton className="w-full h-[20px]" />
            </div>
          </div>

          {/* Skeleton for Footer */}
          <Skeleton className="h-[70px] w-full" />
        </div>
      </div>
    </div>
  );
}
