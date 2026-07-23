'use client';

import { SuspenseBoundary } from '@/components/common/SuspenseBoundary';
import { ResultPageClient } from './ResultPageClient';
import { ResultLoadingFallback } from './ResultLoadingFallback';
import { ResultErrorFallback } from './ResultErrorFallback';

type ResultPageContainerProps = {
  id: number;
};

export function ResultPageContainer({ id }: ResultPageContainerProps) {
  return (
    <SuspenseBoundary
      pendingFallback={<ResultLoadingFallback />}
      errorFallback={(error, reset) => <ResultErrorFallback error={error} onRetry={reset} />}
    >
      <ResultPageClient id={id} />
    </SuspenseBoundary>
  );
}
