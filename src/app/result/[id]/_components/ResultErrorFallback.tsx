'use client';

import { WarningIcon } from '@/components/icon/WarningIcon';
import { Button } from '@/components/ui/Button/Button';

type ResultErrorFallbackProps = {
  error: Error;
  onRetry: () => void;
};

export function ResultErrorFallback({ onRetry }: ResultErrorFallbackProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      {/* 에러 아이콘 */}
      <div className="flex size-14 items-center justify-center rounded-full bg-danger-5">
        <WarningIcon width={28} height={28} className="text-danger-50" />
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-heading-xs font-weight-semibold text-gray-90">이력서를 불러오지 못했어요.</h2>
        <p className="text-body-xs font-weight-medium text-gray-40">잠시후 다시 시도하면 더 좋은 결과 보여드릴게요.</p>
      </div>

      {/* 재시도 버튼 */}
      <Button variant="primary" size="md" onClick={onRetry}>
        다시 시도하기
      </Button>
    </div>
  );
}
