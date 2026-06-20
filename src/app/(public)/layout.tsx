import SkipNav from '@/components/layout/SkipNav';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SkipNav />
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
