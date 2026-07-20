'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DoorIcon } from '@/components/icon/DoorIcon';
import { CancelPresentationIcon } from '@/components/icon/CancelPresentationIcon';
import { CloseIcon } from '@/components/icon/CloseIcon';

type UserDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
};

function UserDropdown({ isOpen, onClose, onLogout, onWithdraw }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      role="menu"
      className={cn(
        'absolute right-0 top-full z-50 mt-2',
        'rounded-xl border border-gray-20 bg-gray-0 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
        'px-[18px] py-[19px]',
      )}
    >
      <div className="flex items-start gap-[15px]">
        <div className="flex w-[116px] flex-col items-center gap-[10px] py-[18px]">
          {/* 로그아웃 */}
          <button type="button" role="menuitem" onClick={onLogout} className="flex items-center gap-[10px]">
            <DoorIcon className="text-gray-90" aria-hidden="true" />
            <span className="whitespace-nowrap text-heading-sm font-weight-semibold tracking-[-0.57px] text-gray-90">
              로그아웃
            </span>
          </button>

          {/* 구분선 */}
          <hr className="w-[96px] border-gray-20" />

          {/* 탈퇴하기 */}
          <button type="button" role="menuitem" onClick={onWithdraw} className="flex items-center gap-[10px]">
            <CancelPresentationIcon className="text-point-50" aria-hidden="true" />
            <span className="whitespace-nowrap text-heading-sm font-weight-semibold tracking-[-0.57px] text-point-50">
              탈퇴하기
            </span>
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button type="button" onClick={onClose} className="shrink-0 text-[#B1B1B1]" aria-label="닫기">
          <CloseIcon aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export { UserDropdown };
