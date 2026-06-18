import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium justify-center',
  {
    variants: {
      variant: {
        success: 'bg-green-50 text-green-600 border-green-600 border ',
        error: 'bg-red-50 text-red-600 border-red-600 border ',
        warning: 'bg-yellow-50 text-yellow-600 border-yellow-600 border',
        info: 'bg-blue-50 text-blue-600 border-blue-600 border',
        neutral: 'bg-secondary text-gray-600 border-gray-600 border',

        processing: 'bg-purple-50 text-purple-600 border-purple-600 border',
        draft: 'bg-amber-50 text-amber-600 border-amber-600 border',
        paused: 'bg-orange-50 text-orange-600 border-orange-600 border',
        archived: 'bg-gray-100 text-gray-500 border-gray-600 border'
      }
    },
    defaultVariants: {
      variant: 'neutral'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function AppBadge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />;
}

export { AppBadge, statusBadgeVariants };
