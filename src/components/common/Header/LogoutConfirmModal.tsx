'use client';

import { useQueryClient } from '@tanstack/react-query';
import { authKeys, useLogout } from '@/api/auth/queries';

type LogoutConfirmModalProps = {
  isOpen: boolean;
  close: () => void;
  unmount: () => void;
};

function LogoutConfirmModal({ isOpen, close, unmount }: LogoutConfirmModalProps) {
  const queryClient = useQueryClient();
  const { mutate: logout } = useLogout();

  if (!isOpen) return null;

  const handleClose = () => {
    close();
    unmount();
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(authKeys.me(), null);
        queryClient.removeQueries({ queryKey: authKeys.me() });
        localStorage.removeItem('terms_agreed');
        handleClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="flex flex-col items-center gap-[40px] rounded-xxxl bg-gray-0 px-[30px] pb-[30px] pt-[50px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-[8px]">
          <h2 id="logout-title" className="text-heading-md font-weight-semibold tracking-[-0.72px] text-gray-90">
            로그아웃하시겠어요?
          </h2>
          <p className="text-center text-heading-xs font-weight-semibold tracking-[-0.51px] text-gray-40">
            로그아웃하면 저장된 분석 결과를
            <br />
            보려면 다시 로그인해야 해요.
          </p>
        </div>

        <div className="flex gap-[10px]">
          <button
            type="button"
            className="w-[200px] rounded-xl bg-gray-5 py-[14px] text-body-lg font-weight-semibold text-gray-60"
            onClick={handleClose}
          >
            취소하기
          </button>
          <button
            type="button"
            className="w-[200px] rounded-xl bg-primary-40 py-[14px] text-body-lg font-weight-semibold text-gray-0"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

export { LogoutConfirmModal };
