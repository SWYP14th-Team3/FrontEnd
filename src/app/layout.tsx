import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://hankkeut.vercel.app'),
  title: {
    default: '한끗 — JD 맞춤 AI 이력서 분석',
    template: '%s | 한끗',
  },
  description: '채용공고(JD)와 이력서를 AI로 대조 분석하여, 핏(fit)과 갭(gap)을 이력서 위에 시각적으로 보여주는 서비스',
  openGraph: {
    siteName: '한끗',
    locale: 'ko_KR',
    type: 'website',
    url: 'https://hankkeut.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
