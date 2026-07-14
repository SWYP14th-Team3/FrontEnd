'use client';

import { createContext, use } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

type ToggleGroupContextValue = {
  value: string;
  onChange: (value: string) => void;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroup() {
  const context = use(ToggleGroupContext);
  if (!context) {
    throw new Error('ToggleGroup.Item must be used within ToggleGroup');
  }
  return context;
}

type ToggleGroupProps = Omit<React.ComponentProps<'div'>, 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

function ToggleGroup({ value, onChange, className, children, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupContext value={{ value, onChange }}>
      <div className={cn('inline-flex items-center gap-2', className)} {...props}>
        {children}
      </div>
    </ToggleGroupContext>
  );
}

type ToggleGroupItemProps = React.ComponentProps<'button'> & {
  value: string;
  asChild?: boolean;
};

function ToggleGroupItem({
  value: itemValue,
  asChild = false,
  className,
  onClick,
  children,
  ...props
}: ToggleGroupItemProps) {
  const { value, onChange } = useToggleGroup();
  const isActive = itemValue === value;
  const classes = cn(
    'px-3 py-2 rounded-regular border text-body-sm cursor-pointer transition-colors',
    isActive
      ? 'bg-primary-10 border-primary-20 text-secondary-60 font-weight-semibold'
      : 'bg-gray-0 border-gray-10 text-gray-50 font-weight-medium hover:bg-gray-5',
    className,
  );
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onChange(itemValue);
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

ToggleGroup.Item = ToggleGroupItem;

export { ToggleGroup, ToggleGroupItem };
