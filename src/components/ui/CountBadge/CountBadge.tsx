import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const countBadgeVariants = cva('inline-flex items-center rounded-[32px] p-2', {
  variants: {
    variant: {
      confirmed: 'bg-success-10',
      needsImprovement: 'bg-warning-10',
      missing: 'bg-danger-10',
    },
  },
  defaultVariants: { variant: 'confirmed' },
});

const countCircleVariants = cva(
  'flex size-[21px] justify-center rounded-full text-[15px] font-weight-medium text-gray-0',
  {
    variants: {
      variant: {
        confirmed: 'bg-success-50',
        needsImprovement: 'bg-warning-50',
        missing: 'bg-danger-40',
      },
    },
    defaultVariants: { variant: 'confirmed' },
  },
);

const countTextVariants = cva('text-body-lg leading-none font-weight-semibold', {
  variants: {
    variant: {
      confirmed: 'text-success-50',
      needsImprovement: 'text-warning-50',
      missing: 'text-danger-40',
    },
  },
  defaultVariants: { variant: 'confirmed' },
});

type CountBadgeProps = React.ComponentProps<'div'> &
  VariantProps<typeof countBadgeVariants> & {
    count: number;
  };

function CountBadge({ className, variant, count, children, ...props }: CountBadgeProps) {
  return (
    <div className={cn(countBadgeVariants({ variant }), className)} {...props}>
      <span className={cn('px-1.5 text-center', countTextVariants({ variant }))}>{children}</span>
      <span className={countCircleVariants({ variant })}>{count}</span>
    </div>
  );
}

export { CountBadge, countBadgeVariants };
export type { CountBadgeProps };
