'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as amplitude from '@amplitude/unified';
import { useSocialLoginCallback } from '@/api/auth/queries';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCalled = useRef(false);

  const code = searchParams.get('code');
  const provider = searchParams.get('provider') as 'kakao' | 'google' | null;

  const { mutate: loginCallback, isError } = useSocialLoginCallback({
    onSuccess: (response) => {
      amplitude.track('Account Signed Up', { provider });
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-body-md font-weight-medium text-gray-60">{message}</p>
        <Link href="/" className="text-body-sm font-weight-semibold text-primary-50 hover:text-primary-60">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Spinner size="md" />
      <p className="text-body-md font-weight-medium text-gray-60">로그인 처리 중...</p>
    </div>
  );
}
