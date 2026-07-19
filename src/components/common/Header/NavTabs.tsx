'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TabMenu } from '@/components/ui/TabMenu/TabMenu';

function NavTabs() {
  const pathname = usePathname();
  const activeTab = pathname.startsWith('/history') ? 'history' : 'analyze';

  return (
    <TabMenu value={activeTab}>
      <TabMenu.Item value="analyze" asChild>
        <Link href="/">분석하기</Link>
      </TabMenu.Item>
      <TabMenu.Item value="history" asChild>
        <Link href="/history">분석 기록</Link>
      </TabMenu.Item>
    </TabMenu>
  );
}

export { NavTabs };
