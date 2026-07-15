import { cn } from '@/lib/utils';

type ProgressBarProps = React.ComponentProps<'div'> & {
  value: number;
};

function ProgressBar({ className, value, ...props }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-3 w-full overflow-hidden rounded-[31px] bg-gray-5', className)}
      {...props}
    >
      <div
        className="h-3 rounded-[31px] bg-primary-40 transition-all duration-500 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
