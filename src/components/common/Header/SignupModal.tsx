'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { authKeys, useAgreements } from '@/api/auth/queries';
import { CheckIcon } from '@/components/icon/CheckIcon';
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon';
import Link from 'next/link';
import { TERMS_OF_SERVICE_URL, PRIVACY_POLICY_URL } from '@/constants/links';

type SignupModalProps = {
  isOpen: boolean;
  close: () => void;
  unmount: () => void;
};

function SignupModal({ isOpen, close, unmount }: SignupModalProps) {
  const queryClient = useQueryClient();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const { mutate: submitAgreements, isPending } = useAgreements();

  if (!isOpen) return null;

  const allAgreed = termsAgreed && privacyAgreed;

  const handleClose = () => {
    close();
    unmount();
  };

  const handleAllAgree = () => {
    const next = !allAgreed;
    setTermsAgreed(next);
    setPrivacyAgreed(next);
  };

  const handleSubmit = () => {
    if (!allAgreed) return;
    submitAgreements(
      { termsAgreed: true, privacyAgreed: true },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: authKeys.me() });
          handleClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        className="flex flex-col items-center gap-[37px] rounded-xxxl border border-gray-10 bg-gray-0 px-[39px] pb-[30px] pt-[50px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 타이틀 */}
        <div
          id="signup-title"
          className="text-center text-heading-md font-weight-semibold leading-[1.5] tracking-[-0.72px] text-gray-90"
        >
          <p>한끗을 시작하기 전</p>
          <p>동의가 필요해요</p>
        </div>

        {/* 약관 동의 + 버튼 */}
        <div className="flex flex-col items-center gap-[11px]">
          <div className="flex flex-col items-center gap-[26px]">
            {/* 체크리스트 */}
            <div className="flex w-[267px] flex-col gap-[9px]">
              {/* 전체동의 */}
              <button type="button" className="flex items-center gap-[5px]" onClick={handleAllAgree}>
                <CheckIcon className={allAgreed ? 'text-primary-40' : 'text-gray-30'} aria-hidden="true" />
                <span
                  className={cn(
                    'text-heading-xxs font-weight-medium tracking-[-0.45px]',
                    allAgreed ? 'text-primary-40' : 'text-gray-30',
                  )}
                >
                  전체동의
                </span>
              </button>

              {/* 구분선 */}
              <hr className="border-gray-20" />

              {/* 이용약관 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-[8px]"
                  onClick={() => setTermsAgreed((prev) => !prev)}
                >
                  <div className="flex items-center gap-[5px]">
                    <CheckIcon className={termsAgreed ? 'text-primary-40' : 'text-gray-30'} aria-hidden="true" />
                    <span
                      className={cn(
                        'text-heading-xxs font-weight-medium tracking-[-0.45px]',
                        termsAgreed ? 'text-primary-40' : 'text-gray-30',
                      )}
                    >
                      필수
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-heading-xxs font-weight-medium tracking-[-0.45px]',
                      termsAgreed ? 'text-primary-40' : 'text-gray-30',
                    )}
                  >
                    이용약관에 동의합니다.
                  </span>
                </button>
                <Link href={TERMS_OF_SERVICE_URL} target="_blank">
                  <ChevronRightIcon className="text-gray-30" aria-hidden="true" />
                </Link>
              </div>

              {/* 개인정보 처리방침 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-[8px]"
                  onClick={() => setPrivacyAgreed((prev) => !prev)}
                >
                  <div className="flex items-center gap-[5px]">
                    <CheckIcon className={privacyAgreed ? 'text-primary-40' : 'text-gray-30'} aria-hidden="true" />
                    <span
                      className={cn(
                        'text-heading-xxs font-weight-medium tracking-[-0.45px]',
                        privacyAgreed ? 'text-primary-40' : 'text-gray-30',
                      )}
                    >
                      필수
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-heading-xxs font-weight-medium tracking-[-0.45px]',
                      privacyAgreed ? 'text-primary-40' : 'text-gray-30',
                    )}
                  >
                    개인정보 처리방침에 동의합니다.
                  </span>
                </button>
                <Link href={PRIVACY_POLICY_URL} target="_blank">
                  <ChevronRightIcon className="text-gray-30" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* 한끗 시작하기 버튼 */}
            <button
              type="button"
              disabled={!allAgreed || isPending}
              className={cn(
                'w-[311px] rounded-xl px-[62px] py-[14px] text-center text-body-lg font-weight-semibold tracking-[-0.57px]',
                allAgreed ? 'bg-primary-40 text-gray-0' : 'cursor-not-allowed bg-gray-20 text-gray-40',
              )}
              onClick={handleSubmit}
            >
              한끗 시작하기
            </button>
          </div>

          {/* 하단 링크 */}
          <div className="flex flex-col items-center gap-[9px]">
            <div className="h-[20px]" />
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
    </div>
  );
}

export { SignupModal };
