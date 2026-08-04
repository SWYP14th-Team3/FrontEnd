import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { OAuthCallbackClient } from './_components/OAuthCallbackClient';

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <Spinner size="md" />
          <p className="text-body-md font-weight-medium text-gray-60">로그인 처리 중...</p>
        </div>
      }
    >
      <OAuthCallbackClient />
    </Suspense>
  );
}
