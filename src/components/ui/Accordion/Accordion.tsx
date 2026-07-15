'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge/Badge';
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon';
import { CopyIcon } from '@/components/icon/CopyIcon';

const accordionVariants = cva('rounded-lg px-[9px] pt-[14px] pb-[9px]', {
  variants: {
    variant: {
      confirmed: 'bg-success-5',
      needsImprovement: 'bg-warning-5',
      missing: 'bg-danger-5',
    },
  },
  defaultVariants: { variant: 'confirmed' },
});

const badgeLabelMap = {
  confirmed: '확인됨',
  needsImprovement: '보강 필요',
  missing: '없음',
} as const;

type AccordionProps = React.ComponentProps<'div'> &
  VariantProps<typeof accordionVariants> & {
    title: string;
    description: string;
    suggestion?: string;
    onCopy?: (text: string) => void;
    defaultOpen?: boolean;
  };

function Accordion({
  className,
  variant,
  title,
  description,
  suggestion,
  onCopy,
  defaultOpen = false,
  ...props
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const resolvedVariant = variant ?? 'confirmed';

  return (
    <div className={cn(accordionVariants({ variant }), className)} {...props}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-[15px] px-[7px]"
      >
        <div className="flex flex-1 items-end gap-[9px]">
          <Badge variant={resolvedVariant}>{badgeLabelMap[resolvedVariant]}</Badge>
          <span className="text-heading-xs font-weight-semibold text-gray-90">{title}</span>
        </div>
        <ChevronDownIcon className={cn('size-6 text-gray-40 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-[15px] flex flex-col gap-4 rounded-regular bg-gray-0 px-[14px] py-4">
          <p className="px-[9px] text-body-md font-weight-regular text-gray-50">{description}</p>

          {suggestion && (
            <div className="flex flex-col gap-[22px] rounded-md bg-gray-5 px-[15px] pt-[15px] pb-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-[3px]">
                  <span className="text-[12px]">💡</span>
                  <span className="text-body-xs font-weight-semibold text-secondary-60">이렇게 보완해보세요</span>
                </div>
                <p className="text-body-sm font-weight-regular text-gray-70">{suggestion}</p>
              </div>

              <button
                type="button"
                onClick={() => onCopy?.(suggestion)}
                className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-regular bg-primary-10 px-[10px] py-1.5 text-body-xs font-weight-semibold text-primary-60"
              >
                <CopyIcon className="size-4" />
                제안 문구 복사
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { Accordion, accordionVariants };
export type { AccordionProps };
