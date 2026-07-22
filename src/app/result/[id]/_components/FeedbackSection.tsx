'use client';

import { Feedback } from '@/components/common/Feedback/Feedback';
import { CheckboxIcon } from '@/components/icon/CheckboxIcon';
import { useSatisfaction } from '@/api/analysis/queries';

type FeedbackSectionProps = {
  analysisId: number;
  initialSatisfaction: 'LIKE' | 'DISLIKE' | null;
};

function FeedbackSection({ analysisId, initialSatisfaction }: FeedbackSectionProps) {
  const { mutate } = useSatisfaction(analysisId);

  const handleFeedback = (type: 'up' | 'down') => {
    mutate({ satisfaction: type === 'up' ? 'LIKE' : 'DISLIKE' });
  };

  if (initialSatisfaction !== null) {
    return (
      <div className="flex items-center gap-[3px]">
        <CheckboxIcon className="size-[23px] shrink-0" />
        <span className="font-weight-medium text-[18px] whitespace-nowrap text-gray-40">의견이 반영되었어요!</span>
      </div>
    );
  }

  return <Feedback onFeedback={handleFeedback} />;
}

export { FeedbackSection };
export type { FeedbackSectionProps };
