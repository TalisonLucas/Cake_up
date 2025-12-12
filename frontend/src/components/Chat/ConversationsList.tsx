import { useEffect } from 'react';
import { HiChat, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import type { Conversation } from '../../types';

type ConversationFilter = 'all' | 'orders' | 'operator-admin';

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  activeConversationId: string | null;
  filter?: ConversationFilter;
}

export const ConversationsList = ({ onSelectConversation, activeConversationId, filter = 'all' }: ConversationsListProps) => {
  const { conversations, loadConversations, loading } = useChatStore();
  const { user } = useAuthStore();

  // Filtrar conversas baseado no filtro
  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'all') return true;
    if (filter === 'orders') return conv.type === 'client-operator';
    if (filter === 'operator-admin') return conv.type === 'operator-admin';
    return true;
  });

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null;
    return conversation.participants.find(p => p.id !== user.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { icon: HiClock, color: 'text-blue-600 bg-blue-100', label: 'Aberta' };
      case 'resolved':
        return { icon: HiCheckCircle, color: 'text-green-600 bg-green-100', label: 'Resolvida' };
      case 'closed':
        return { icon: HiXCircle, color: 'text-gray-600 bg-gray-100', label: 'Fechada' };
      default:
        return { icon: HiClock, color: 'text-blue-600 bg-blue-100', label: 'Aberta' };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <HiChat size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            {filter !== 'all' 
              ? `Nenhuma conversa encontrada para o filtro selecionado`
              : 'Nenhuma conversa ainda'
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {filter === 'all' ? 'Inicie uma nova conversa para começar' : 'Tente outro filtro'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-2">
        {filteredConversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          const isActive = activeConversationId === conversation.id;
          const lastMessage = conversation.lastMessage;
          const unreadCount = conversation.unreadCount || 0;
          const statusBadge = getStatusBadge(conversation.status || 'open');
          const StatusIcon = statusBadge.icon;
          const isOrderConversation = !!conversation.relatedOrderId || !!conversation.orderDetails;
          const isAssigned = !!conversation.assignedOperatorId;

          // Determinar título da conversa
          let conversationTitle = otherParticipant?.name || 'Usuário';
          if (isOrderConversation && conversation.orderDetails) {
            conversationTitle = `Pedido #${conversation.orderDetails.id} - ${conversation.orderDetails.userName}`;
          } else if (conversation.type === 'operator-admin') {
            conversationTitle = 'Administrador';
          }

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full p-4 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-purple-100 border-2 border-purple-500'
                  : 'bg-white hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">
                    {isOrderConversation ? '#' : (otherParticipant?.name?.charAt(0).toUpperCase() || 'U')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {conversationTitle}
                      </p>
                      {isOrderConversation && !isAssigned && user?.role === 'operator' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          Não atribuída
                        </span>
                      )}
                      {isAssigned && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          Atribuída
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusIcon className={`h-4 w-4 ${statusBadge.color.split(' ')[0]}`} />
                      {lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOrderConversation && conversation.orderDetails && (
                    <p className="text-xs text-gray-500 mb-1">
                      Status: {conversation.orderDetails.statusDisplay}
                    </p>
                  )}
                  {lastMessage ? (
                    <p className="text-sm text-gray-600 truncate">
                      {lastMessage.message}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Nenhuma mensagem ainda</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
