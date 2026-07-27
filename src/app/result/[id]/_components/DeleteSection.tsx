'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';

type DeleteSectionProps = {
  analysisId: number;
};

function DeleteSection({ analysisId }: DeleteSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          className="bg-danger-5 text-body-lg font-weight-semibold text-danger-40 w-full max-w-[520px] rounded-xl py-[14px]"
          onClick={() => setIsModalOpen(true)}
        >
          삭제하기
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={isModalOpen}
        close={() => setIsModalOpen(false)}
        unmount={() => setIsModalOpen(false)}
        analysisResultId={analysisId}
        onDeleteSuccess={() => router.push('/history')}
      />
    </>
  );
}

export { DeleteSection };
