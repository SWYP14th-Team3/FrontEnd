import { Suspense } from 'react';
import { OAuthCallbackClient } from './_components/OAuthCallbackClient';

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="bg-primary-500 mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-gray-700">로그인 처리 중...</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackClient />
    </Suspense>
  );
}
