'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WarningIcon } from '@/components/icon/WarningIcon';
import { CheckIcon } from '@/components/icon/CheckIcon';

type WithdrawConfirmModalProps = {
  isOpen: boolean;
  close: () => void;
  unmount: () => void;
};

function WithdrawConfirmModal({ isOpen, close, unmount }: WithdrawConfirmModalProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    close();
    unmount();
  };

  const handleWithdraw = () => {
    if (!agreed) return;
    console.warn('탈퇴 API 미구현');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        className="flex flex-col rounded-xxxl border border-gray-10 bg-gray-0 px-[38px] py-[51px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-[458px] flex-col justify-between">
          {/* 타이틀 */}
          <div className="flex flex-col gap-[9px]">
            <h2 id="withdraw-title" className="text-heading-md font-weight-semibold tracking-[-0.72px] text-gray-90">
              더이상 한끗을 이용하지 않으시나요?
            </h2>
            <p className="text-heading-xs font-weight-semibold tracking-[-0.51px] text-gray-40">
              다시 가입할 수 있지만 이전 기록은 복구되지 않아요.
            </p>
          </div>

          {/* 안내 박스 + 체크박스 */}
          <div className="mt-[39px] flex flex-col gap-[28px]">
            <div className="w-full bg-gray-10 px-[24px] py-[19px]">
              <p className="text-heading-xs font-weight-semibold tracking-[-0.51px] text-black">
                탈퇴하면 아래 정보가 모두 삭제되고 복구할 수 없어요
              </p>
              <div className="mt-[10px] flex flex-col gap-[5px]">
                <div className="flex items-center gap-[3px]">
                  <WarningIcon width={18} height={18} className="text-gray-90" aria-hidden="true" />
                  <span className="text-heading-xxs font-weight-medium tracking-[-0.45px] text-black">
                    업로드한 이력서와 저장된 모든 버전
                  </span>
                </div>
                <div className="flex items-center gap-[3px]">
                  <WarningIcon width={18} height={18} className="text-gray-90" aria-hidden="true" />
                  <span className="text-heading-xxs font-weight-medium tracking-[-0.45px] text-black">
                    공고별 분석 결과와 히스토리
                  </span>
                </div>
              </div>
            </div>

            {/* 체크박스 */}
            <button type="button" className="flex items-center gap-[8px]" onClick={() => setAgreed((prev) => !prev)}>
              <CheckIcon className={agreed ? 'text-primary-40' : 'text-gray-30'} aria-hidden="true" />
              <span
                className={cn(
                  'text-heading-xxs font-weight-medium tracking-[-0.45px]',
                  agreed ? 'text-primary-40' : 'text-gray-30',
                )}
              >
                위 주의사항을 숙지했고, 탈퇴에 동의합니다
              </span>
            </button>
          </div>

          {/* 버튼 */}
          <div className="mt-[44px] flex gap-[10px]">
            <button
              type="button"
              className="w-[224px] rounded-xl bg-gray-5 py-[14px] text-body-lg font-weight-semibold text-gray-60"
              onClick={handleClose}
            >
              더 써볼래요
            </button>
            <button
              type="button"
              disabled={!agreed}
              className={cn(
                'w-[224px] rounded-xl py-[14px] text-body-lg font-weight-semibold',
                agreed ? 'bg-primary-40 text-gray-0' : 'cursor-not-allowed bg-gray-20 text-gray-40',
              )}
              onClick={handleWithdraw}
            >
              떠날래요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { WithdrawConfirmModal };
