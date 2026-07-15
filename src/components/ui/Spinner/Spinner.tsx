import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'size-6',
      md: 'size-12',
      lg: 'size-[102px]',
    },
  },
  defaultVariants: { size: 'md' },
});

type SpinnerProps = React.ComponentProps<'svg'> & VariantProps<typeof spinnerVariants>;

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ size }), className)}
      role="status"
      aria-label="로딩 중"
      {...props}
    >
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" className="text-gray-5" />
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="31.4 94.2"
        className="text-primary-40"
      />
    </svg>
  );
}

export { Spinner, spinnerVariants };
export type { SpinnerProps };
