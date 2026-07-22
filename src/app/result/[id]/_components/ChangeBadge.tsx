import { cn } from '@/lib/utils';
import { ArrowRightIcon } from '@/components/icon/ArrowRightIcon';

type ChangeBadgeVariant = 'confirmed' | 'needsImprovement' | 'missing';

const variantStyles: Record<ChangeBadgeVariant, { bg: string; text: string; prevCircle: string; nextCircle: string }> =
  {
    confirmed: {
      bg: 'bg-success-5',
      text: 'text-success-50',
      prevCircle: 'bg-success-30',
      nextCircle: 'bg-success-50',
    },
    needsImprovement: {
      bg: 'bg-warning-5',
      text: 'text-warning-50',
      prevCircle: 'bg-warning-30',
      nextCircle: 'bg-warning-50',
    },
    missing: { bg: 'bg-danger-5', text: 'text-danger-40', prevCircle: 'bg-danger-20', nextCircle: 'bg-danger-40' },
  };

type ChangeBadgeProps = {
  label: string;
  variant: ChangeBadgeVariant;
  prev: number;
  next: number;
};

function ChangeBadge({ label, variant, prev, next }: ChangeBadgeProps) {
  const styles = variantStyles[variant];
  return (
    <div className={cn('flex items-center rounded-[32px] p-2', styles.bg)}>
      <span className={cn('text-body-lg font-weight-semibold px-1.5', styles.text)}>{label}</span>
      <span
        className={cn(
          'font-weight-medium text-gray-0 flex size-[21px] items-center justify-center rounded-full text-[15px]',
          styles.prevCircle,
        )}
      >
        {prev}
      </span>
      <ArrowRightIcon className="text-gray-40 size-[23px]" />
      <span
        className={cn(
          'font-weight-medium text-gray-0 flex size-[21px] items-center justify-center rounded-full text-[15px]',
          styles.nextCircle,
        )}
      >
        {next}
      </span>
    </div>
  );
}

export { ChangeBadge };
export type { ChangeBadgeProps, ChangeBadgeVariant };
