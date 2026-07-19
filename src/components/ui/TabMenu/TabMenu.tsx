'use client';

import { createContext, use } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

type TabMenuContextValue = {
  value: string;
  onChange?: (value: string) => void;
};

const TabMenuContext = createContext<TabMenuContextValue | null>(null);

function useTabMenu() {
  const context = use(TabMenuContext);
  if (!context) {
    throw new Error('TabMenu.Item must be used within TabMenu');
  }
  return context;
}

type TabMenuProps = Omit<React.ComponentProps<'div'>, 'onChange'> & {
  value: string;
  onChange?: (value: string) => void;
};

function TabMenu({ value, onChange, className, children, ...props }: TabMenuProps) {
  return (
    <TabMenuContext value={{ value, onChange }}>
      <div className={cn('inline-flex items-center gap-2.5', className)} {...props}>
        {children}
      </div>
    </TabMenuContext>
  );
}

type TabMenuItemProps = React.ComponentProps<'button'> & {
  value: string;
  asChild?: boolean;
};

function TabMenuItem({ value: itemValue, asChild = false, className, onClick, children, ...props }: TabMenuItemProps) {
  const { value, onChange } = useTabMenu();
  const isActive = itemValue === value;
  const classes = cn(
    'px-3.5 py-1.5 rounded-regular text-body-sm font-weight-semibold cursor-pointer transition-colors',
    isActive ? 'bg-primary-20 text-primary-60' : 'text-gray-60 hover:bg-gray-5',
    className,
  );
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onChange?.(itemValue);
    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot className={classes} onClick={handleClick} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={classes} {...props}>
      {children}
    </button>
  );
}

TabMenu.Item = TabMenuItem;

export { TabMenu, TabMenuItem };
