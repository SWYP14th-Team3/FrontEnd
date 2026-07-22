'use client';

import { useState, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex flex-col gap-1 rounded-lg border p-[14px] bg-gray-0 transition-colors',
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
    autoResize?: boolean;
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
  autoResize = false,
  ...props
}: TextareaProps) {
  const [internalLength, setInternalLength] = useState(typeof defaultValue === 'string' ? defaultValue.length : 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resolvedState = disabled ? 'disabled' : state;
  const displayCount = value !== undefined ? String(value).length : internalLength;

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [autoResize, value, defaultValue]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInternalLength(e.target.value.length);
    if (autoResize) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    onChange?.(e);
  }

  return (
    <div className="flex flex-1 flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-body-xs font-weight-semibold text-gray-90">
          {label}
        </label>
      )}
      <div className={cn(textareaVariants({ state: resolvedState }), className)}>
        <textarea
          ref={textareaRef}
          id={id}
          className={cn(
            'text-heading-xs font-weight-medium text-gray-90 placeholder:text-gray-30 flex-1 resize-none scrollbar-none bg-transparent outline-none',
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
          <span className="text-body-xs font-weight-medium text-gray-30 shrink-0 self-end">
            {displayCount}자/{maxLength}자
          </span>
        )}
      </div>
    </div>
  );
}

export { Textarea, textareaVariants };
export type { TextareaProps };
