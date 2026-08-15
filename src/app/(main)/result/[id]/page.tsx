import type { Metadata } from 'next';
import { ResultPageContainer } from './_components/ResultPageContainer';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `분석 결과 #${id}`,
    robots: { index: false },
  };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ResultPageContainer id={Number(id)} />;
}
