'use client';

import { useDeleteAnalysis } from '@/api/analysis/queries';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  close: () => void;
  unmount: () => void;
  analysisResultId: number;
};

function DeleteConfirmModal({ isOpen, close, unmount, analysisResultId }: DeleteConfirmModalProps) {
  const { mutate: deleteAnalysis, isPending, isError } = useDeleteAnalysis();

  if (!isOpen) return null;

  const handleClose = () => {
    close();
    unmount();
  };

  const handleDelete = () => {
    deleteAnalysis(analysisResultId, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="rounded-xxxl bg-gray-0 flex flex-col items-center gap-[40px] px-[30px] pt-[50px] pb-[30px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-[8px]">
          <div className="bg-danger-5 flex size-[40px] items-center justify-center rounded-full">
            <span className="text-body-lg text-danger-40">!</span>
          </div>
          <h2 id="delete-title" className="text-heading-md font-weight-semibold text-gray-90 mt-2 tracking-[-0.72px]">
            분석 결과를 삭제하시겠어요?
          </h2>
          <p className="text-heading-xs font-weight-semibold text-gray-40 tracking-[-0.51px]">
            삭제한 결과는 복구할 수 없어요.
          </p>
          {isError && (
            <p className="text-body-sm font-weight-medium text-danger-40 mt-1">삭제에 실패했어요. 다시 시도해주세요.</p>
          )}
        </div>

        <div className="flex gap-[10px]">
          <button
            type="button"
            className="bg-gray-5 text-body-lg font-weight-semibold text-gray-60 w-[200px] rounded-xl py-[14px]"
            onClick={handleClose}
            disabled={isPending}
          >
            취소하기
          </button>
          <button
            type="button"
            className="bg-primary-40 text-body-lg font-weight-semibold text-gray-0 w-[200px] rounded-xl py-[14px]"
            onClick={handleDelete}
            disabled={isPending}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}

export { DeleteConfirmModal };
