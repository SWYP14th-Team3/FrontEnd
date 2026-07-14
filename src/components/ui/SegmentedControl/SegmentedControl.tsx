'use client';

import { createContext, use } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/Slot';

type SegmentedControlContextValue = {
  value: string;
  onChange: (value: string) => void;
};

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

function useSegmentedControl() {
  const context = use(SegmentedControlContext);
  if (!context) {
    throw new Error('SegmentedControl.Item must be used within SegmentedControl');
  }
  return context;
}

type SegmentedControlProps = Omit<React.ComponentProps<'div'>, 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

function SegmentedControl({ value, onChange, className, children, ...props }: SegmentedControlProps) {
  return (
    <SegmentedControlContext value={{ value, onChange }}>
      <div className={cn('bg-gray-10 inline-flex items-center rounded-lg p-1.5', className)} {...props}>
        {children}
      </div>
    </SegmentedControlContext>
  );
}

type SegmentedControlItemProps = React.ComponentProps<'button'> & {
  value: string;
  asChild?: boolean;
};

function SegmentedControlItem({
  value: itemValue,
  asChild = false,
  className,
  onClick,
  children,
  ...props
}: SegmentedControlItemProps) {
  const { value, onChange } = useSegmentedControl();
  const isActive = itemValue === value;
  const classes = cn(
    'rounded-regular text-body-sm font-weight-semibold inline-flex h-[35px] w-[102px] cursor-pointer items-center justify-center gap-1 transition-colors',
    isActive ? 'bg-primary-40 text-gray-0' : 'text-gray-70',
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

SegmentedControl.Item = SegmentedControlItem;

export { SegmentedControl, SegmentedControlItem };
