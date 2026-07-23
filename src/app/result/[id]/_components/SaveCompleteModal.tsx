'use client';

import { useRouter } from 'next/navigation';
import { CheckIcon } from '@/components/icon/CheckIcon';

type SaveCompleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function SaveCompleteModal({ isOpen, onClose }: SaveCompleteModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToHistory = () => {
    onClose();
    router.push('/history');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-complete-title"
        className="mx-4 flex flex-col items-center gap-10 rounded-xxxl bg-gray-0 px-6 pb-6 pt-10 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] sm:mx-0 sm:px-[30px] sm:pb-[30px] sm:pt-[50px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-5">
            <CheckIcon width={28} height={28} className="text-success-50" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 id="save-complete-title" className="text-heading-md font-weight-semibold tracking-[-0.72px] text-gray-90">
              저장이 완료되었어요!
            </h2>
            <p className="text-center text-heading-xs font-weight-semibold tracking-[-0.51px] text-gray-40">
              저장된 분석 결과는 분석 기록에서
              <br />
              언제든 다시 확인할 수 있어요.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[10px] sm:w-auto sm:flex-row">
          <button
            type="button"
            className="w-full cursor-pointer rounded-xl bg-gray-5 py-[14px] text-body-lg font-weight-semibold text-gray-60 sm:w-[200px]"
            onClick={onClose}
          >
            페이지에 남기
          </button>
          <button
            type="button"
            className="w-full cursor-pointer rounded-xl bg-primary-40 py-[14px] text-body-lg font-weight-semibold text-gray-0 sm:w-[200px]"
            onClick={handleGoToHistory}
          >
            저장목록으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

export { SaveCompleteModal };
