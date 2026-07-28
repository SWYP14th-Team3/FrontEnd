import type { ReactNode } from 'react';
import { OverlayProvider } from 'overlay-kit';
import { MSWProvider } from '@/providers/MSWProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AmplitudeProvider } from '@/providers/AmplitudeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MSWProvider>
      <QueryProvider>
        <OverlayProvider>
          <AmplitudeProvider>{children}</AmplitudeProvider>
        </OverlayProvider>
      </QueryProvider>
    </MSWProvider>
  );
}
