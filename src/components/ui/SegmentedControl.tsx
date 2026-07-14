'use client';

import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

type SegmentItem = Omit<React.ComponentProps<'button'>, 'value'> & {
  value: string;
  label: string;
  icon?: React.ReactNode;
  asChild?: boolean;
};

type SegmentedControlProps = {
  items: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function SegmentedControl({ items, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn('bg-gray-10 inline-flex items-center rounded-lg p-1.5', className)}>
      {items.map(
        ({ value: itemValue, label, icon, className: itemClassName, onClick, asChild, children, ...itemProps }) => {
          const isActive = itemValue === value;
          const classes = cn(
            'rounded-regular text-body-sm font-weight-semibold inline-flex h-[35px] w-[102px] cursor-pointer items-center justify-center gap-1 transition-colors',
            isActive ? 'bg-primary-40 text-gray-0' : 'text-gray-70',
            itemClassName,
          );
          const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            onChange(itemValue);
            onClick?.(e);
          };

          if (asChild && children) {
            return (
              <Slot key={itemValue} className={classes} onClick={handleClick} {...itemProps}>
                {children}
              </Slot>
            );
          }

          return (
            <button key={itemValue} type="button" onClick={handleClick} className={classes} {...itemProps}>
              {icon && <span className="-mt-[1.2px] shrink-0">{icon}</span>}
              {label}
            </button>
          );
        },
      )}
    </div>
  );
}

export { SegmentedControl };
export type { SegmentItem, SegmentedControlProps };
