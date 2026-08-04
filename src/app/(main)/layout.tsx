import { Header } from '@/components/common/Header/Header';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="layout-container">{children}</main>
    </>
  );
}
