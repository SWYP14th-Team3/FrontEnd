import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/getQueryClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { parseResponse } from '@/lib/parseResponse';
import { analysisResultSchema } from '@/api/analysis/schema';
import { analysisKeys } from '@/api/analysis/queries';
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
  const numId = Number(id);

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: analysisKeys.detail(numId),
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/analyses/${numId}`);
      return parseResponse(res, analysisResultSchema);
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResultPageContainer id={numId} />
    </HydrationBoundary>
  );
}
