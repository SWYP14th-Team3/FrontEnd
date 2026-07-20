'use client';

import { useState } from 'react';
import { overlay } from 'overlay-kit';
import { useUser } from '@/hooks/useUser';
import { UserDropdown } from './UserDropdown';
import { LoginModal } from './LoginModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { WithdrawConfirmModal } from './WithdrawConfirmModal';

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="size-8 animate-pulse rounded-full bg-gray-10" />
      <div className="h-4 w-16 animate-pulse rounded-sm bg-gray-10" />
    </div>
  );
}

function Avatar() {
  return <div className="size-8 rounded-full border-[1.14px] border-gray-20 bg-[#b5b5b5]" />;
}

function AuthSection() {
  const { user, isLoggedIn, isLoading } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isLoading) {
    return <AuthSkeleton />;
  }

  if (!isLoggedIn || !user) {
    return (
      <button
        type="button"
        className="rounded-regular bg-primary-40 px-6 py-1.5 text-body-sm font-weight-semibold text-gray-0 transition-colors hover:bg-primary-50"
        onClick={() => {
          overlay.open(({ isOpen, close, unmount }) => (
            <LoginModal isOpen={isOpen} close={close} unmount={unmount} />
          ));
        }}
      >
        로그인
      </button>
    );
  }

  const handleLogout = () => {
    setIsDropdownOpen(false);
    overlay.open(({ isOpen, close, unmount }) => (
      <LogoutConfirmModal isOpen={isOpen} close={close} unmount={unmount} />
    ));
  };

  const handleWithdraw = () => {
    setIsDropdownOpen(false);
    overlay.open(({ isOpen, close, unmount }) => (
      <WithdrawConfirmModal isOpen={isOpen} close={close} unmount={unmount} />
    ));
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
      >
        <Avatar />
        <span className="text-heading-xs font-weight-semibold tracking-[-0.51px] text-black">{user.name}</span>
      </button>
      <UserDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onLogout={handleLogout}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}

export { AuthSection };
