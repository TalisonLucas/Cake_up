import { useEffect, type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  const { isAuthenticated } = useAuthStore();
  const ensureChatSession = useChatStore((s) => s.ensureChatSession);
  const disconnectWebSocket = useChatStore((s) => s.disconnectWebSocket);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectWebSocket();
      return;
    }

    ensureChatSession();
  }, [isAuthenticated, ensureChatSession, disconnectWebSocket]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header title={title} />
      <main className="flex-1 overflow-y-auto pb-20 pt-4">
        <div className="mx-auto px-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};
