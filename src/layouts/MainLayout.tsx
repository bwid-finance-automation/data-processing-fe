import Header from '@layouts/Header';
import Footer from '@layouts/Footer';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col theme-bg-app transition-colors duration-300">
        {children}
      </main>
      <Footer />
    </div>
  );
}
