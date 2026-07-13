'use client';

import { useState, useEffect } from 'react';

type MSWProviderProps = {
  children: React.ReactNode;
};

export function MSWProvider({ children }: MSWProviderProps) {
  const shouldMock = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';
  const [ready, setReady] = useState(!shouldMock);

  useEffect(() => {
    if (!shouldMock) return;

    import('@/mocks/init').then(({ initMocks }) => {
      initMocks().then(() => setReady(true));
    });
  }, [shouldMock]);

  if (!ready) return null;

  return <>{children}</>;
}
