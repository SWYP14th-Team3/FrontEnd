'use client';

import { cn } from '@/lib/utils';
import { GoogleLogo } from '@/components/icon/GoogleLogo';
import { KakaoLogo } from '@/components/icon/KakaoLogo';

type SocialLoginButtonProps = {
  provider: 'google' | 'kakao';
  onClick?: () => void;
  className?: string;
};

function SocialLoginButton({ provider, onClick, className }: SocialLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center rounded-xl bg-gray-5 px-[44px] py-[14px]',
        provider === 'kakao' ? 'gap-[14px]' : 'gap-[10px]',
        className,
      )}
    >
      {provider === 'google' ? <GoogleLogo /> : <KakaoLogo />}
      <span className="text-body-lg font-weight-semibold tracking-[-0.57px] text-gray-60">
        {provider === 'google' ? 'Google 계정으로 계속하기' : 'Kakao 계정으로 계속하기'}
      </span>
    </button>
  );
}

export { SocialLoginButton };
