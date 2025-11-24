import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMenu, HiShoppingCart, HiUser } from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();

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
          <Link
            to="/produtos"
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
              <Link
                to="/produtos"
                className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Produtos
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/pedidos"
                    className="block px-4 py-3 hover:bg-cake-pink transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pedidos
                  </Link>
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


