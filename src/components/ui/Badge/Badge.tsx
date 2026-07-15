import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center justify-center rounded-md px-[10px] py-[2px] text-body-sm font-weight-semibold', {
  variants: {
    variant: {
      confirmed: 'bg-success-10 text-success-50',
      needsImprovement: 'bg-warning-10 text-warning-50',
      missing: 'bg-danger-10 text-danger-50',
    },
  },
  defaultVariants: { variant: 'confirmed' },
});

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const priorityBadgeVariants = cva('flex items-center justify-center size-[76px] rounded-xxl font-weight-bold text-[31px]', {
  variants: {
    priority: {
      high: 'bg-success-10 text-success-50',
      medium: 'bg-warning-10 text-warning-50',
      low: 'bg-danger-10 text-danger-40',
    },
  },
  defaultVariants: { priority: 'high' },
});

type PriorityBadgeProps = React.ComponentProps<'div'> & VariantProps<typeof priorityBadgeVariants>;

function PriorityBadge({ className, priority, ...props }: PriorityBadgeProps) {
  const labels = { high: '상', medium: '중', low: '하' } as const;
  return (
    <div className={cn(priorityBadgeVariants({ priority }), className)} {...props}>
      {labels[priority ?? 'high']}
    </div>
  );
}

export { Badge, badgeVariants, PriorityBadge, priorityBadgeVariants };
export type { BadgeProps, PriorityBadgeProps };
