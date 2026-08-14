import type { Metadata } from 'next';
import { HistoryPageClient } from './_components/HistoryPageClient';

export const metadata: Metadata = {
  title: '분석 이력',
  description: '지금까지 분석한 이력서 결과를 한눈에 확인하세요.',
  robots: { index: false },
};

export default function HistoryPage() {
  return <HistoryPageClient />;
}
