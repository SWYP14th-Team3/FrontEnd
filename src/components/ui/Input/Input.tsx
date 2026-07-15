import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'w-full bg-gray-0 rounded-lg border p-[14px] text-heading-xs font-weight-medium text-gray-90 placeholder:text-gray-30 outline-none transition-colors',
  {
    variants: {
      state: {
        default: 'border-gray-10 focus:border-primary-40',
        error: 'border-danger-40',
        disabled: 'border-gray-10 bg-gray-5 text-gray-30 cursor-not-allowed',
      },
    },
    defaultVariants: { state: 'default' },
  },
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants> & {
    label?: string;
    helperText?: string;
  };

function Input({ className, state, label, helperText, disabled, id, ...props }: InputProps) {
  const resolvedState = disabled ? 'disabled' : state;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-body-xs font-weight-semibold text-gray-90">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(inputVariants({ state: resolvedState }), className)}
        disabled={disabled || state === 'disabled'}
        {...props}
      />
      {helperText && <span className="text-body-xs font-weight-medium text-gray-30">{helperText}</span>}
    </div>
  );
}

export { Input, inputVariants };
export type { InputProps };
