import type { Metadata } from 'next';
import { AnalyzingClient } from './_components/AnalyzingClient';

export const metadata: Metadata = {
  title: '분석 중',
  robots: { index: false },
};

export default function AnalyzingPage() {
  return <AnalyzingClient />;
}
