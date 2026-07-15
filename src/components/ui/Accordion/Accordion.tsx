'use client';

import { useState, useId } from 'react';
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
  const buttonId = useId();
  const panelId = useId();
  const resolvedVariant = variant ?? 'confirmed';

  return (
    <div className={cn(accordionVariants({ variant }), className)} {...props}>
      <button
        type="button"
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-[15px] px-[7px]"
      >
        <div className="flex flex-1 items-end gap-[9px]">
          <Badge variant={resolvedVariant}>{badgeLabelMap[resolvedVariant]}</Badge>
          <span className="text-heading-xs font-weight-semibold text-gray-90">{title}</span>
        </div>
        <ChevronDownIcon className={cn('text-gray-40 size-6 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="rounded-regular bg-gray-0 mt-[15px] flex flex-col gap-4 px-[14px] py-4">
          <p className="text-body-md font-weight-regular px-[9px] text-gray-50">{description}</p>

          {suggestion && (
            <div className="bg-gray-5 flex flex-col gap-[22px] rounded-md px-[15px] pt-[15px] pb-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-[3px]">
                  <span className="text-[12px]">💡</span>
                  <span className="text-body-xs font-weight-semibold text-secondary-60">이렇게 보완해보세요</span>
                </div>
                <p className="text-body-sm font-weight-regular text-gray-70">{suggestion}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onCopy) {
                    onCopy(suggestion);
                  } else {
                    navigator.clipboard.writeText(suggestion);
                  }
                }}
                className="rounded-regular bg-primary-10 text-body-xs font-weight-semibold text-primary-60 inline-flex w-fit cursor-pointer items-center gap-1 px-[10px] py-1.5"
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
