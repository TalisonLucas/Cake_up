import { useState, useEffect, useRef } from 'react';
import { HiX, HiPaperAirplane, HiUserCircle, HiShieldCheck } from 'react-icons/hi';
import type { ChatMessage } from '../../types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
}

const formatRemaining = (ms: number): string => {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ChatWindow = ({ conversationId, onClose }: ChatWindowProps) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const { 
    messages, 
    sendMessage, 
    markAsRead, 
    loadMessages, 
    conversations,
    callAdmin,
    markResolved,
    closeConversation,
    loadConversations,
  } = useChatStore();
  
  const conversationMessages = messages[conversationId] || [];
  const conversation = conversations.find(c => c.id === conversationId);
  const isOrderConversation = !!conversation?.relatedOrderId || !!conversation?.orderDetails;
  const isOperator = user?.role === 'operator';
  const isAdmin = user?.role === 'admin';
  const isClosed = conversation?.status === 'closed';

  const orderStatus = (conversation?.orderDetails?.status || '').toUpperCase();
  const orderPaid = orderStatus === 'PAGO' || orderStatus === 'PAID';
  const autoCloseAtMs = conversation?.autoCloseAt
    ? new Date(conversation.autoCloseAt).getTime()
    : null;
  const remainingMs = autoCloseAtMs != null ? autoCloseAtMs - now : null;
  const canClose =
    !isClosed &&
    (!!conversation?.autoCloseAt || orderPaid || conversation?.type === 'operator-admin');

  useEffect(() => {
    loadMessages(conversationId);
    if (user) {
      markAsRead(conversationId, user.id);
    }
  }, [conversationId, loadMessages, markAsRead, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Countdown + auto-refresh quando o timer vencer
  useEffect(() => {
    if (!autoCloseAtMs || isClosed) return;

    const tick = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= autoCloseAtMs) {
        loadConversations();
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [autoCloseAtMs, isClosed, loadConversations]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user || isClosed) return;

    sendMessage(conversationId, message.trim(), user.id, user.name, user.role);
    setMessage('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const handleCallAdmin = async () => {
    if (!conversationId || loadingAction) return;
    setLoadingAction(true);
    try {
      await callAdmin(conversationId);
    } catch (error) {
      console.error('Erro ao chamar administrador:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!conversationId || loadingAction) return;
    setLoadingAction(true);
    try {
      await markResolved(conversationId);
    } catch (error) {
      console.error('Erro ao marcar como resolvida:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!conversationId || loadingAction) return;
    if (!confirm('Deseja encerrar esta conversa? Não será possível enviar novas mensagens.')) {
      return;
    }
    setLoadingAction(true);
    try {
      await closeConversation(conversationId);
    } catch (error: any) {
      console.error('Erro ao encerrar conversa:', error);
      alert(error.response?.data?.error || 'Não foi possível encerrar a conversa.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-white">
              {isOrderConversation && conversation?.orderDetails
                ? `Pedido #${conversation.orderDetails.id}`
                : 'Chat'}
            </h3>
            {isOrderConversation && conversation?.orderDetails && (
              <p className="text-xs text-purple-100">
                {conversation.orderDetails.userName} • {conversation.orderDetails.statusDisplay}
              </p>
            )}
            {conversation?.status && (
              <p className="text-xs text-purple-100 mt-1">
                Status:{' '}
                {conversation.status === 'open'
                  ? 'Aberta'
                  : conversation.status === 'resolved'
                    ? 'Resolvida'
                    : 'Fechada'}
              </p>
            )}
            {!isClosed && remainingMs != null && remainingMs > 0 && (
              <p className="text-xs text-amber-100 mt-1 font-medium">
                Encerra automaticamente em {formatRemaining(remainingMs)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <HiX size={20} className="text-white" />
          </button>
        </div>
        
        {/* Action Buttons */}
        {!isClosed && (
          <div className="flex flex-wrap gap-2 mt-2">
            {isOperator && (
              <button
                onClick={handleCallAdmin}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingAction ? 'Carregando...' : 'Chamar Administrador'}
              </button>
            )}
            {(isOperator || isAdmin) && conversation?.status === 'open' && (
              <button
                onClick={handleMarkResolved}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingAction ? 'Carregando...' : 'Marcar como Resolvida'}
              </button>
            )}
            {canClose && (
              <button
                onClick={handleCloseConversation}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingAction ? 'Carregando...' : 'Encerrar conversa'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-4xl mb-2">👋</p>
            <p>Inicie a conversa!</p>
          </div>
        ) : (
          conversationMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="p-4 border-t border-gray-200 bg-gray-100 text-center text-sm text-gray-600">
          Esta conversa foi encerrada. Não é possível enviar novas mensagens.
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Enviar"
            >
              <HiPaperAirplane size={20} className="text-white" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'operator':
        return {
          icon: HiUserCircle,
          color: 'bg-blue-100 text-blue-700',
          label: 'Operador'
        };
      case 'admin':
        return {
          icon: HiShieldCheck,
          color: 'bg-purple-100 text-purple-700',
          label: 'Administrador'
        };
      default:
        return null;
    }
  };

  const roleBadge = message.senderRole ? getRoleBadge(message.senderRole) : null;
  const RoleIcon = roleBadge?.icon;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-purple-600 text-white rounded-br-none'
            : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
        }`}
      >
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-gray-600">
              {message.senderName}
            </p>
            {roleBadge && RoleIcon && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${roleBadge.color}`}>
                <RoleIcon size={12} />
                {roleBadge.label}
              </span>
            )}
          </div>
        )}
        <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>{message.message}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-right text-purple-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};
