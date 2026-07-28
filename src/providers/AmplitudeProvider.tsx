'use client';

import { useEffect, type ReactNode } from 'react';
import * as amplitude from '@amplitude/unified';

let isInitialized = false;

export function AmplitudeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (isInitialized) return;

    const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
    if (!apiKey) {
      console.warn('Amplitude API key missing — analytics disabled');
      return;
    }

    amplitude.initAll(apiKey, {
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });

    isInitialized = true;
  }, []);

  return <>{children}</>;
}
