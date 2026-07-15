'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type DialogAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'assistive';
  icon?: React.ReactNode;
};

type DialogProps = React.ComponentProps<'div'> & {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions: DialogAction[];
};

function Dialog({ className, open, onClose, icon, title, description, actions, ...props }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" {...props}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'rounded-xxxl bg-gray-0 relative z-10 flex flex-col items-center gap-10 px-[30px] pb-[30px] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
          icon ? 'pt-10' : 'pt-[50px]',
          className,
        )}
      >
        <div className="flex w-[319px] flex-col items-center gap-[19px]">
          {icon && <div className="size-[46px]">{icon}</div>}
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h2 className="text-heading-md font-weight-semibold text-gray-90 whitespace-nowrap">{title}</h2>
            {description && (
              <p className="text-heading-xs font-weight-semibold text-gray-40 w-[247px]">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-[10px]">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={cn(
                'text-body-lg font-weight-semibold inline-flex w-[200px] cursor-pointer items-center justify-center gap-[10px] rounded-xl py-[14px]',
                action.variant === 'assistive' || !action.variant
                  ? 'bg-gray-5 text-gray-60'
                  : 'bg-primary-40 text-gray-0',
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Dialog };
export type { DialogProps, DialogAction };
