import Header from '@layouts/Header';
import Footer from '@layouts/Footer';

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen theme-bg-app dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {children}
      </main>
      <Footer />
    </>
  );
}
