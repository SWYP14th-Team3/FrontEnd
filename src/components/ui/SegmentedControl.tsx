'use client';

import { cn } from '@/lib/utils';

type SegmentItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
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
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'rounded-regular text-body-sm font-weight-semibold inline-flex h-[35px] w-[102px] cursor-pointer items-center justify-center gap-1 transition-colors',
              isActive ? 'bg-primary-40 text-gray-0' : 'text-gray-70',
            )}
          >
            {item.icon && <span className="-mt-[1.2px] shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
export type { SegmentItem, SegmentedControlProps };
