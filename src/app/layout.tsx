import './globals.css';
import { Providers } from '@/providers/Providers';
import { Header } from '@/components/common/Header/Header';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans">
        <Providers>
          <Header />
          <main className="layout-container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
