import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header title={title} />
      <main className="flex-1 overflow-y-auto pb-20 pt-4">
        <div className="max-w-md mx-auto px-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};


