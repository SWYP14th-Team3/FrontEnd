'use client';

import { useState, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge/Badge';
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon';
import { CopyIcon } from '@/components/icon/CopyIcon';
import { CheckIcon } from '@/components/icon/CheckIcon';
import { FolderOpenIcon } from '@/components/icon/FolderOpenIcon';
import { LightBulbIcon } from '@/components/icon/LightBulbIcon';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

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
  confirmed: '충족',
  needsImprovement: '부분 충족',
  missing: '미충족',
} as const;

type AccordionProps = React.ComponentProps<'div'> &
  VariantProps<typeof accordionVariants> & {
    title: string;
    description: string;
    suggestion?: string;
    onCopy?: (text: string) => void;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    rank?: number;
    badgeLabel?: string;
  };

function Accordion({
  className,
  variant,
  title,
  description,
  suggestion,
  onCopy,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  rank,
  badgeLabel,
  ...props
}: AccordionProps) {
  const resolvedVariant = variant ?? 'confirmed';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const { copied, copy } = useCopyToClipboard();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };
  const buttonId = useId();
  const panelId = useId();

  return (
    <div
      className={cn(
        'rounded-lg px-[9px] pt-[14px] pb-[9px] transition-colors duration-300 ease-out',
        isOpen ? accordionVariants({ variant }) : 'bg-gray-5',
        className,
      )}
      {...props}
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
        className="flex w-full cursor-pointer items-center gap-[15px] px-[7px]"
      >
        <div className="flex flex-1 items-end gap-[9px]">
          {rank != null && (
            <span className="inline-flex items-center justify-center rounded-md bg-primary-10 px-[10px] py-[2px] text-body-sm font-weight-semibold text-primary-40">
              {rank}순위
            </span>
          )}
          <Badge variant={resolvedVariant}>{badgeLabel ?? badgeLabelMap[resolvedVariant]}</Badge>
          <span className="text-heading-xs font-weight-semibold text-black">{title}</span>
        </div>
        <div className="flex size-6 items-center justify-center rounded-[3px] bg-gray-0">
          <ChevronDownIcon className={cn('size-4 text-gray-20 transition-transform duration-300', isOpen && 'rotate-180')} />
        </div>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          isOpen ? 'mt-[15px] grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 rounded-regular bg-gray-0 px-[14px] py-4">
            <div className="flex flex-col gap-2 px-[9px]">
              <div className="flex items-center gap-[3px]">
                <FolderOpenIcon className="size-3 shrink-0" />
                <span className="text-body-xs font-weight-semibold text-secondary-60">근거</span>
              </div>
              <p className="text-body-md font-weight-regular text-gray-50">{description}</p>
            </div>

            {suggestion && (
              <div className="flex flex-col gap-[22px] rounded-md bg-gray-5 px-[15px] pt-[15px] pb-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-[3px]">
                    <LightBulbIcon className="size-3 shrink-0" />
                    <span className="text-body-xs font-weight-semibold text-secondary-60">한끗 피드백</span>
                  </div>
                  <p className="text-body-sm font-weight-regular text-gray-70">{suggestion}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onCopy) {
                      onCopy(suggestion);
                    } else {
                      copy(suggestion);
                    }
                  }}
                  className={cn(
                    'inline-flex w-fit cursor-pointer items-center gap-1 rounded-regular px-[10px] py-1.5 text-body-xs font-weight-semibold transition-colors duration-200',
                    copied ? 'bg-success-5 text-success-50' : 'bg-primary-10 text-primary-60',
                  )}
                >
                  {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  {copied ? '복사 완료!' : '한끗 차이 문구 복사'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Accordion, accordionVariants };
export type { AccordionProps };
