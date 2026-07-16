import type { ReactNode } from 'react';
import { OverlayProvider } from 'overlay-kit';
import { MSWProvider } from '@/providers/MSWProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MSWProvider>
      <QueryProvider>
        <OverlayProvider>{children}</OverlayProvider>
      </QueryProvider>
    </MSWProvider>
  );
}
