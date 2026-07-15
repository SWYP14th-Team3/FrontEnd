'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex w-[429px] h-[129px] flex-col gap-1 rounded-lg border p-[14px] bg-gray-0 transition-colors',
  {
    variants: {
      state: {
        default: 'border-gray-10 focus-within:border-primary-40',
        error: 'border-danger-40',
        disabled: 'border-gray-10 bg-gray-5 cursor-not-allowed',
      },
    },
    defaultVariants: { state: 'default' },
  },
);

type TextareaProps = React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants> & {
    label?: string;
  };

function Textarea({
  className,
  state,
  label,
  maxLength,
  disabled,
  id,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const [internalLength, setInternalLength] = useState(typeof defaultValue === 'string' ? defaultValue.length : 0);

  const resolvedState = disabled ? 'disabled' : state;
  const displayCount = value !== undefined ? String(value).length : internalLength;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInternalLength(e.target.value.length);
    onChange?.(e);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-body-xs font-weight-semibold text-gray-90">
          {label}
        </label>
      )}
      <div className={cn(textareaVariants({ state: resolvedState }), className)}>
        <textarea
          id={id}
          className={cn(
            'flex-1 bg-transparent text-heading-xs font-weight-medium text-gray-90 placeholder:text-gray-30 outline-none resize-none scrollbar-none',
            resolvedState === 'disabled' && 'text-gray-30 cursor-not-allowed',
          )}
          disabled={disabled || state === 'disabled'}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        {maxLength && (
          <span className="self-end shrink-0 text-body-xs font-weight-medium text-gray-30">
            {displayCount}자/{maxLength}자
          </span>
        )}
      </div>
    </div>
  );
}

export { Textarea, textareaVariants };
export type { TextareaProps };
