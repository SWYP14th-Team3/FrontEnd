'use client';

import { useEffect, type ReactNode } from 'react';
import { initAmplitude } from '@/lib/amplitude';

let isInitialized = false;

export function AmplitudeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (isInitialized) return;

    const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
    if (!apiKey) {
      console.warn('Amplitude API key missing — analytics disabled');
      return;
    }

    isInitialized = true;
    void initAmplitude(apiKey);
  }, []);

  return <>{children}</>;
}
