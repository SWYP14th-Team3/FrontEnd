'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocialLoginCallback } from '@/api/auth/queries';

export function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCalled = useRef(false);

  const code = searchParams.get('code');
  const provider = searchParams.get('provider') as 'kakao' | 'google' | null;

  const { mutate: loginCallback, isError } = useSocialLoginCallback({
    onSuccess: (response) => {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'OAUTH_SUCCESS', termsRequired: response.termsRequired },
          window.location.origin,
        );
        window.close();
      } else {
        router.replace('/');
      }
    },
    onError: () => {
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_ERROR', error: 'LOGIN_FAILED' }, window.location.origin);
        window.close();
      }
    },
  });

  useEffect(() => {
    if (!code || !provider || hasCalled.current) return;
    hasCalled.current = true;

    loginCallback({ provider, code });
  }, [code, provider, loginCallback]);

  if (!code || !provider || isError) {
    const message = isError
      ? '로그인에 실패했습니다. 다시 시도해주세요.'
      : '잘못된 접근입니다. 인증 정보가 누락되었습니다.';
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="mb-6 text-gray-700">{message}</p>
          <Link href="/" className="text-primary-500 hover:text-primary-600 font-medium underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="bg-primary-500 mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-gray-700">로그인 처리 중...</p>
      </div>
    </div>
  );
}
