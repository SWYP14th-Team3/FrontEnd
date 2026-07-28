'use client';

import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { Spinner } from '@/components/ui/Spinner/Spinner';

type AnalyzingProgressProps = {
  progress: number;
};

function getProgressText(progress: number): string {
  if (progress <= 25) return '공고와 이력서를 비교하고있어요.';
  if (progress <= 50) return '적합도를 계산하고 있어요.';
  return '맞춤 개선 피드백을 작성하고 있어요.';
}

function AnalyzingProgress({ progress }: AnalyzingProgressProps) {
  const text = getProgressText(progress);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[64px]">
      <div className="relative flex items-center justify-center">
        <Spinner size="lg" className="absolute" />
        <svg
          width="29"
          height="19"
          viewBox="0 0 56 29"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="29" y="19" width="29" height="9" rx="2" transform="rotate(-180 29 19)" fill="#B1CEFB" />
          <rect x="10" y="29" width="29" height="9" rx="2" transform="rotate(-90 10 29)" fill="#B1CEFB" />
          <rect
            x="55.0293"
            y="10.0488"
            width="25.4878"
            height="8.04878"
            rx="2"
            transform="rotate(-180 55.0293 10.0488)"
            fill="#B1CEFB"
          />
          <rect
            x="46.9805"
            y="27.4883"
            width="25.4878"
            height="8.04878"
            rx="2"
            transform="rotate(-90 46.9805 27.4883)"
            fill="#B1CEFB"
          />
          <path
            d="M52.4733 7.74369C53.2543 8.52474 53.2543 9.79107 52.4733 10.5721L36.1432 26.9022C35.7681 27.2773 35.2594 27.488 34.729 27.488H29.003C27.2212 27.488 26.3289 25.3337 27.5888 24.0738L46.7819 4.88071C47.5629 4.09966 48.8293 4.09966 49.6103 4.88071L52.4733 7.74369Z"
            fill="#B1CEFB"
          />
        </svg>
      </div>
      <p className="text-heading-md font-weight-semibold text-gray-90 text-center">{text}</p>
      <ProgressBar value={progress} className="w-[539px]" />
    </div>
  );
}

export { AnalyzingProgress };
