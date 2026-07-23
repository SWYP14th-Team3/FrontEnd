import { ResultPageContainer } from './_components/ResultPageContainer';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ResultPageContainer id={Number(id)} />;
}
