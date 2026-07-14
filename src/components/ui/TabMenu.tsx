'use client';

import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

type TabMenuItem = Omit<React.ComponentProps<'button'>, 'value'> & {
  value: string;
  label: string;
  asChild?: boolean;
};

type TabMenuProps = {
  items: TabMenuItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function TabMenu({ items, value, onChange, className }: TabMenuProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      {items.map(({ value: itemValue, label, className: itemClassName, onClick, asChild, children, ...itemProps }) => {
        const isActive = itemValue === value;
        const classes = cn(
          'px-3.5 py-1.5 rounded-regular text-body-sm font-weight-semibold cursor-pointer transition-colors',
          isActive ? 'bg-primary-20 text-primary-60' : 'text-gray-60 hover:bg-gray-5',
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

export { TabMenu };
export type { TabMenuItem, TabMenuProps };
