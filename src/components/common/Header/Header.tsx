'use client';

import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { NavTabs } from './NavTabs';
import { AuthSection } from './AuthSection';

function Header({ className }: { className?: string }) {
  return (
    <header className={cn('layout-container flex h-[60px] items-center', className)}>
      <Logo />
      <nav className="flex flex-1 items-center justify-center">
        <NavTabs />
      </nav>
      <AuthSection />
    </header>
  );
}

export { Header };
