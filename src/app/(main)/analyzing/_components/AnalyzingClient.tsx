'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as amplitude from '@amplitude/unified';
import { useCreateAnalysis } from '@/api/analysis/queries';
import { ApiRequestError } from '@/lib/errors';
import { useAnalysisFormStore } from '@/store/analysisFormStore';
import { AnalyzingProgress } from './AnalyzingProgress';
import { AnalyzingError } from './AnalyzingError';

const PROGRESS_SCHEDULE = [
  { value: 0, delay: 0 },
  { value: 25, delay: 4000 },
  { value: 50, delay: 10000 },
  { value: 75, delay: 18000 },
];

function AnalyzingClient() {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'loading' | 'error'>('loading');
  const [errorType, setErrorType] = useState('');

  const router = useRouter();
  const { mutate: createAnalysis } = useCreateAnalysis();
  const progressRef = useRef(0);
  const apiCompletedRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const initRef = useRef(false);

  function fastForwardToComplete(resultId: number) {
    const current = progressRef.current;
    const remainingSteps = [25, 50, 75, 100].filter((v) => v > current);

    remainingSteps.forEach((step, index) => {
      const timer = setTimeout(
        () => {
          setProgress(step);
          progressRef.current = step;
        },
        (index + 1) * 500,
      );
      timersRef.current.push(timer);
    });

    // 100% 도달 후 바로 redirect (spinner는 계속 돌고 있는 상태)
    const redirectTimer = setTimeout(
      () => {
        useAnalysisFormStore.getState().clear();
        router.replace(`/result/${resultId}`);
      },
      (remainingSteps.length + 1) * 500,
    );
    timersRef.current.push(redirectTimer);
  }

  useEffect(() => {
    if (initRef.current) return;

    const store = useAnalysisFormStore.getState();
    if (!store.hasInput()) {
      router.replace('/');
      return;
    }

    const formData = store.toFormData();
    if (!formData) {
      router.replace('/');
      return;
    }

    initRef.current = true;

    // 1. 타이머 시작
    PROGRESS_SCHEDULE.forEach(({ value, delay }) => {
      if (delay === 0) {
        setProgress(value);
        progressRef.current = value;
        return;
      }
      const timer = setTimeout(() => {
        if (!apiCompletedRef.current) {
          setProgress(value);
          progressRef.current = value;
        }
      }, delay);
      timersRef.current.push(timer);
    });

    // 2. API 호출
    createAnalysis(formData, {
      onSuccess: (data) => {
        apiCompletedRef.current = true;
        amplitude.track('Analysis Completed');
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        fastForwardToComplete(data.analysisResultId);
      },
      onError: (error) => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        if (error instanceof ApiRequestError && error.errorType) {
          setErrorType(error.errorType);
        } else {
          setErrorType('ANALYSIS_FAILED');
        }
        setState('error');
      },
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      apiCompletedRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'error') {
    return <AnalyzingError errorType={errorType} onRetry={() => router.replace('/')} />;
  }
  return <AnalyzingProgress progress={progress} />;
}

export { AnalyzingClient };
