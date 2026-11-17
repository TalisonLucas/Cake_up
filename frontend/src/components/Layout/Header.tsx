import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMenu, HiShoppingCart, HiUser, HiChat } from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useChatStore } from '../../store/chatStore';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const conversations = useChatStore((s) => s.conversations);
  // Badge só conta mensagens não lidas de conversas abertas
  const chatUnread = conversations.reduce((total, conv) => {
    if (conv.status !== 'open') return total;
    return total + (conv.unreadCount || 0);
  }, 0);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="bg-cake-pink text-cake-text sticky top-0 z-50 shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu Hamburguer */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 hover:bg-cake-dark-pink rounded-lg transition-colors"
          aria-label="Menu"
        >
          <HiMenu size={24} />
        </button>

        {/* Título */}
        <h1 className="text-xl font-semibold">{title}</h1>

        {/* Ícones direita */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link
              to="/chat"
              className="p-2 hover:bg-cake-dark-pink rounded-lg transition-colors relative"
              aria-label="Notificações de chat"
            >
              <HiChat size={24} />
              {chatUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/carrinho"
            className="p-2 hover:bg-cake-dark-pink rounded-lg transition-colors relative"
            aria-label="Carrinho"
          >
            <HiShoppingCart size={24} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
          <Link
            to={isAuthenticated ? '/perfil' : '/login'}
            className="p-2 hover:bg-cake-dark-pink rounded-lg transition-colors"
            aria-label="Perfil"
          >
            <HiUser size={24} />
          </Link>
        </div>
      </div>

      {/* Menu Dropdown */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-full bg-white shadow-lg rounded-b-lg w-64 z-50">
            <nav className="py-2">
              <Link
                to="/"
                className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <>
                  {user?.role === 'admin' ? (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-3 hover:bg-cake-pink transition-colors font-semibold bg-purple-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        👑 Dashboard Admin
                      </Link>
                      <Link
                        to="/operador/dashboard"
                        className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🎯 Dashboard Operador
                      </Link>
                    </>
                  ) : user?.role === 'operator' ? (
                    <Link
                      to="/operador/dashboard"
                      className="block px-4 py-3 hover:bg-cake-pink transition-colors font-semibold bg-purple-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      🎯 Dashboard Operador
                    </Link>
                  ) : (
                    <Link
                      to="/pedidos"
                      className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Pedidos
                    </Link>
                  )}
                  <Link
                    to="/perfil"
                    className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                </>
              )}
              <Link
                to="/historia"
                className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                História
              </Link>
              <Link
                to="/quem-somos"
                className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Quem somos
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 hover:bg-cake-pink transition-colors text-red-600"
                >
                  Sair
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
};



