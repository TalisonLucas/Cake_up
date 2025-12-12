import { useState } from 'react';
import { HiChat, HiCheckCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import type { Conversation } from '../../types';

interface OrderChatButtonProps {
  orderId: string | number;
  existingConversation?: Conversation;
  variant?: 'button' | 'icon' | 'link';
  className?: string;
}

export const OrderChatButton = ({ 
  orderId, 
  existingConversation,
  variant = 'button',
  className = ''
}: OrderChatButtonProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createConversationFromOrder, conversations } = useChatStore();

  // Verificar se já existe conversa para este pedido
  const conversation = existingConversation || conversations.find(
    conv => conv.relatedOrderId === orderId || conv.orderDetails?.id === orderId
  );

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      let targetConversation = conversation;

      // Se não existe conversa, criar uma
      if (!targetConversation) {
        targetConversation = await createConversationFromOrder(orderId);
      }

      // Navegar para a página de chat e abrir a conversa
      navigate('/chat', { state: { conversationId: targetConversation.id } });
    } catch (error) {
      console.error('Erro ao criar/abrir conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determinar texto do botão baseado no role
  const getButtonText = () => {
    if (user?.role === 'operator') {
      return conversation ? 'Abrir Conversa' : 'Contatar Cliente';
    }
    return conversation ? 'Abrir Chat' : 'Pedir Ajuda';
  };

  // Variante: botão completo
  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {conversation ? (
          <>
            <HiCheckCircle size={18} />
            {loading ? 'Carregando...' : getButtonText()}
          </>
        ) : (
          <>
            <HiChat size={18} />
            {loading ? 'Carregando...' : getButtonText()}
          </>
        )}
      </button>
    );
  }

  // Variante: apenas ícone
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
          conversation
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        } ${className}`}
        aria-label={getButtonText()}
        title={getButtonText()}
      >
        {conversation ? <HiCheckCircle size={20} /> : <HiChat size={20} />}
      </button>
    );
  }

  // Variante: link
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 ${className}`}
    >
      {conversation ? <HiCheckCircle size={18} /> : <HiChat size={18} />}
      {loading ? 'Carregando...' : getButtonText()}
    </button>
  );
};

