'use client';

import { SuspenseBoundary } from '@/components/common/SuspenseBoundary';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { HistoryPageClient } from './HistoryPageClient';

function HistoryPageContainer() {
  return (
    <SuspenseBoundary
      pendingFallback={
        <div className="flex items-center justify-center py-[200px]">
          <Spinner size="lg" />
        </div>
      }
      errorFallback={(_error, reset) => (
        <div className="flex flex-col items-center justify-center gap-4 py-[200px]">
          <p className="text-heading-xs font-weight-medium text-gray-40">분석 결과를 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-regular bg-primary-40 text-body-sm font-weight-semibold text-gray-0 px-4 py-2"
          >
            다시 시도하기
          </button>
        </div>
      )}
    >
      <HistoryPageClient />
    </SuspenseBoundary>
  );
}

export { HistoryPageContainer };
