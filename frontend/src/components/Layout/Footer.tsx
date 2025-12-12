import { HiChat } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useEffect } from 'react';

export const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { orders, loadOrders } = useOrderStore();

  // Carregar pedidos quando componente montar (se for cliente)
  useEffect(() => {
    if (user?.role === 'client') {
      loadOrders();
    }
  }, [user, loadOrders]);

  const handleChatClick = () => {
    if (!user) {
      alert('Por favor, faça login para acessar o chat.');
      return;
    }

    const userRole = user.role;
    const isHomePage = location.pathname === '/' || location.pathname === '/home';

    // Cliente: lógica especial para página home
    if (userRole === 'client') {
      // Se estiver na página home, redirecionar para lista de pedidos
      if (isHomePage) {
        navigate('/meus-pedidos');
        return;
      }
      
      // Em outras páginas: verificar se tem pedidos
      if (orders.length === 0) {
        alert('Você não tem nenhum pedido para solicitar contato. Faça um pedido primeiro!');
        return;
      }
      // Se tem pedidos, navegar para chat
      navigate('/chat');
      return;
    }

    // Operador: navegar diretamente para chat
    if (userRole === 'operator') {
      navigate('/chat');
      return;
    }

    // Administrador: navegar diretamente para chat
    if (userRole === 'admin') {
      navigate('/chat');
      return;
    }

    // Fallback: navegar para chat
    navigate('/chat');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-center py-3">
        <button
          onClick={handleChatClick}
          className="flex items-center gap-2 px-6 py-2 bg-cake-pink hover:bg-cake-dark-pink rounded-full transition-colors shadow-md"
          aria-label="Chat"
        >
          <HiChat size={20} />
          <span className="font-medium">Chat</span>
        </button>
      </div>
    </footer>
  );
};




