'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThumbUpIcon } from '@/components/icon/ThumbUpIcon';
import { ThumbDownIcon } from '@/components/icon/ThumbDownIcon';
import { CheckboxIcon } from '@/components/icon/CheckboxIcon';

type FeedbackProps = React.ComponentProps<'div'> & {
  onFeedback?: (type: 'up' | 'down') => void;
};

function Feedback({ className, onFeedback, ...props }: FeedbackProps) {
  const [selected, setSelected] = useState<'up' | 'down' | null>(null);

  function handleClick(type: 'up' | 'down') {
    if (selected === type) {
      setSelected(null);
    } else {
      setSelected(type);
      onFeedback?.(type);
    }
  }

  return (
    <div className={cn('flex items-center gap-[9px]', className)} {...props}>
      {selected === null ? (
        <>
          <span className="font-weight-medium text-gray-40 text-[18px] whitespace-nowrap">
            이 분석이 도움이 되었나요?
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleClick('up')}
              className="rounded-regular border-gray-20 bg-gray-5 flex size-[37px] cursor-pointer items-center justify-center border"
            >
              <ThumbUpIcon className="size-6 text-gray-50" />
            </button>
            <button
              type="button"
              onClick={() => handleClick('down')}
              className="rounded-regular border-gray-20 bg-gray-5 flex size-[37px] cursor-pointer items-center justify-center border"
            >
              <ThumbDownIcon className="size-6 text-gray-50" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-[3px]">
            <CheckboxIcon className="size-[23px] shrink-0" />
            <span className="font-weight-medium text-gray-40 text-[18px] whitespace-nowrap">의견이 반영되었어요!</span>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="font-weight-medium text-gray-30 cursor-pointer text-[18px] whitespace-nowrap underline"
          >
            재클릭시 변경 가능
          </button>
        </>
      )}
    </div>
  );
}

export { Feedback };
export type { FeedbackProps };
