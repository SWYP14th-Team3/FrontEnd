'use client';

import { Suspense, type ErrorInfo, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export type SuspenseBoundaryProps = {
  children: ReactNode;
  pendingFallback: ReactNode;
  errorFallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
};

export function SuspenseBoundary({
  children,
  pendingFallback,
  errorFallback,
  onError,
  onReset,
  resetKeys,
}: SuspenseBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError} onReset={onReset} resetKeys={resetKeys}>
      <Suspense fallback={pendingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
