import type { Metadata } from 'next';
import { HomePage } from './_components/HomePage';

export const metadata: Metadata = {
  description: '채용공고와 이력서를 업로드하면 AI가 핏/갭을 분석해 이력서 위에 시각적으로 보여줍니다.',
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '한끗',
    url: 'https://hankkeut.vercel.app',
    description:
      '채용공고(JD)와 이력서를 AI로 대조 분석하여, 핏(fit)과 갭(gap)을 이력서 위에 시각적으로 보여주는 서비스',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <HomePage />
    </>
  );
}
