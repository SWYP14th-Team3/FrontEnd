'use client';

import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

type ToggleGroupItem = Omit<React.ComponentProps<'button'>, 'value'> & {
  value: string;
  label: string;
  asChild?: boolean;
};

type ToggleGroupProps = {
  items: ToggleGroupItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function ToggleGroup({ items, value, onChange, className }: ToggleGroupProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {items.map(({ value: itemValue, label, className: itemClassName, onClick, asChild, children, ...itemProps }) => {
        const isActive = itemValue === value;
        const classes = cn(
          'px-3 py-2 rounded-regular border text-body-sm cursor-pointer transition-colors',
          isActive
            ? 'bg-primary-10 border-primary-20 text-secondary-60 font-weight-semibold'
            : 'bg-gray-0 border-gray-10 text-gray-50 font-weight-medium hover:bg-gray-5',
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
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { ToggleGroup };
export type { ToggleGroupItem, ToggleGroupProps };
