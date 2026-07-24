'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { overlay } from 'overlay-kit';
import { authKeys, useSocialLoginCallback } from '@/api/auth/queries';
import Link from 'next/link';
import { TERMS_OF_SERVICE_URL, PRIVACY_POLICY_URL } from '@/constants/links';
import { SocialLoginButton } from './SocialLoginButton';
import { SignupModal } from './SignupModal';

import type { OAuthProvider } from '@/api/auth/types';

type LoginModalProps = {
  isOpen: boolean;
  close: () => void;
  unmount: () => void;
};

const IS_MSW = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';

type LoginError = '' | 'RETRY' | 'CANCELLED' | 'DUPLICATE_EMAIL';

const ERROR_MESSAGES: Record<LoginError, string> = {
  '': '',
  RETRY: '다시 시도해주세요.',
  CANCELLED: '로그인이 취소되었어요.',
  DUPLICATE_EMAIL: '이미 가입된 이메일이에요.',
};

const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || '';

const getOAuthUrl = (provider: OAuthProvider) => {
  const redirectUri = encodeURIComponent(`${REDIRECT_URI}?provider=${provider}`);

  if (provider === 'google') {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
  }

  return `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
};

function LoginModal({ isOpen, close, unmount }: LoginModalProps) {
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);
  const [error, setError] = useState<LoginError>('');

  const handleClose = () => {
    close();
    unmount();
  };

  const { mutate: mockLogin } = useSocialLoginCallback({
    onSuccess: (response) => {
      if (response.termsRequired) {
        handleClose();
        overlay.open(({ isOpen: signupIsOpen, close: signupClose, unmount: signupUnmount }) => (
          <SignupModal isOpen={signupIsOpen} close={signupClose} unmount={signupUnmount} />
        ));
      } else {
        queryClient.invalidateQueries({ queryKey: authKeys.me() });
        handleClose();
      }
    },
    onError: () => {
      setError('RETRY');
    },
  });

  useEffect(() => {
    if (IS_MSW) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'OAUTH_SUCCESS') {
        const termsRequired = event.data?.termsRequired ?? false;
        if (termsRequired) {
          handleClose();
          overlay.open(({ isOpen: signupIsOpen, close: signupClose, unmount: signupUnmount }) => (
            <SignupModal isOpen={signupIsOpen} close={signupClose} unmount={signupUnmount} />
          ));
        } else {
          queryClient.invalidateQueries({ queryKey: authKeys.me() });
          handleClose();
        }
      }

      if (event.data?.type === 'OAUTH_ERROR') {
        setError('RETRY');
      }
    };

    if (isOpen) {
      window.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, close, queryClient]);

  if (!isOpen) return null;

  const handleSocialLogin = (provider: OAuthProvider) => {
    setError('');

    if (IS_MSW) {
      mockLogin({ code: 'mock-code', provider });
      return;
    }

    const url = getOAuthUrl(provider);
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    popupRef.current = window.open(
      url,
      'oauth-popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
    );

    if (!popupRef.current) {
      setError('RETRY');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="flex flex-col items-center gap-[27px] rounded-xxxl border border-gray-10 bg-gray-0 px-[39px] pb-[30px] pt-[50px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 타이틀 */}
        <div className="flex flex-col items-center gap-[5px]">
          <h2 id="login-title" className="text-heading-md font-weight-semibold tracking-[-0.72px] text-gray-90">
            로그인
          </h2>
          <p className="text-heading-xs font-weight-semibold tracking-[-0.51px] text-gray-40">
            합격을 가르는 마지막 한 끗
          </p>
        </div>

        {/* 소셜 로그인 버튼 + 에러 + 링크 */}
        <div className="flex flex-col items-center gap-[9px]">
          <div className="flex w-[319px] flex-col gap-[10px]">
            <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} />
            <SocialLoginButton provider="kakao" onClick={() => handleSocialLogin('kakao')} />
          </div>

          {/* 에러 메시지 */}
          <div className="h-[20px]">
            {error && (
              <p className="text-body-xs font-weight-medium tracking-[-0.39px] text-gray-60">
                {ERROR_MESSAGES[error]}
              </p>
            )}
          </div>

          {/* 이용약관 링크 */}
          <p className="text-body-xs font-weight-medium tracking-[-0.39px] text-gray-30">
            <Link
              href={TERMS_OF_SERVICE_URL}
              target="_blank"
              className="hover:underline"
            >
              이용약관
            </Link>
            {' | '}
            <Link
              href={PRIVACY_POLICY_URL}
              target="_blank"
              className="hover:underline"
            >
              개인정보 처리방침
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export { LoginModal };
