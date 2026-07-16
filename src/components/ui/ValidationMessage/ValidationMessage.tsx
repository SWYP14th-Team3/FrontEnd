import { cn } from '@/lib/utils';
import { WarningIcon } from '@/components/icon/WarningIcon';

type ValidationMessageProps = {
  className?: string;
  children: React.ReactNode;
  variant?: 'error';
};

function ValidationMessage({ className, children }: ValidationMessageProps) {
  return (
    <div className={cn('flex items-center gap-[3px]', className)}>
      <WarningIcon className="text-danger-40 size-[14px] shrink-0" />
      <p className="text-body-xs font-weight-semibold text-danger-40">{children}</p>
    </div>
  );
}

export { ValidationMessage };
export type { ValidationMessageProps };
