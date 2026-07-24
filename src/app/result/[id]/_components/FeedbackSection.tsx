'use client';

import { Feedback } from '@/components/common/Feedback/Feedback';
import { useSatisfaction } from '@/api/analysis/queries';

type FeedbackSectionProps = {
  analysisId: number;
  initialSatisfaction: 'LIKE' | 'DISLIKE' | null;
};

function FeedbackSection({ analysisId, initialSatisfaction }: FeedbackSectionProps) {
  const { mutate } = useSatisfaction(analysisId);

  const handleFeedback = (type: 'up' | 'down' | null) => {
    mutate({ satisfaction: type === 'up' ? 'LIKE' : type === 'down' ? 'DISLIKE' : null });
  };

  return (
    <Feedback
      initialSelected={
        initialSatisfaction === 'LIKE' ? 'up' : initialSatisfaction === 'DISLIKE' ? 'down' : null
      }
      onFeedback={handleFeedback}
    />
  );
}

export { FeedbackSection };
export type { FeedbackSectionProps };
