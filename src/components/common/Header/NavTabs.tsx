'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { TabMenu } from '@/components/ui/TabMenu/TabMenu';
import { useUser } from '@/hooks/useUser';
import { LoginModal } from './LoginModal';

function NavTabs() {
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useUser();
  const activeTab = pathname.startsWith('/history') ? 'history' : 'analyze';

  return (
    <TabMenu value={activeTab}>
      <TabMenu.Item value="analyze" asChild>
        <Link href="/">분석하기</Link>
      </TabMenu.Item>
      <TabMenu.Item value="history" asChild>
        <Link
          href="/history"
          prefetch={false}
          onNavigate={(e) => {
            if (!isLoading && !isLoggedIn) {
              e.preventDefault();
              overlay.open(({ isOpen, close, unmount }) => (
                <LoginModal isOpen={isOpen} close={close} unmount={unmount} message="로그인 후 이용해주세요" />
              ));
            }
          }}
        >
          분석 기록
        </Link>
      </TabMenu.Item>
    </TabMenu>
  );
}

export { NavTabs };
