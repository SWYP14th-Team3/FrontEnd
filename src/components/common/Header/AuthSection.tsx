'use client';

import { useUser } from '@/hooks/useUser';

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-gray-10 size-8 animate-pulse rounded-full" />
      <div className="bg-gray-10 h-4 w-16 animate-pulse rounded-sm" />
    </div>
  );
}

function Avatar() {
  return <div className="border-gray-20 size-8 rounded-full border-[1.14px] bg-[#b5b5b5]" />;
}

function AuthSection() {
  const { user, isLoggedIn, isLoading } = useUser();

  if (isLoading) {
    return <AuthSkeleton />;
  }

  if (!isLoggedIn || !user) {
    return (
      <button
        type="button"
        className="rounded-regular bg-primary-40 text-body-sm font-weight-semibold text-gray-0 hover:bg-primary-50 px-6 py-1.5 transition-colors"
      >
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar />
      <span className="text-heading-xs font-weight-semibold tracking-[-0.51px] text-black">{user.name}</span>
    </div>
  );
}

export { AuthSection };
