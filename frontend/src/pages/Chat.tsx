import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { ConversationsList } from '../components/Chat/ConversationsList';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { UserSelector } from '../components/Chat/UserSelector';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { HiPlus, HiChat, HiExclamationCircle } from 'react-icons/hi';

type ConversationFilter = 'all' | 'orders' | 'operator-admin';

export const Chat = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { error: chatError } = useChatStore();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [filter, setFilter] = useState<ConversationFilter>('all');

  // Abrir conversa se veio do state (ex: ao clicar em OrderChatButton)
  useEffect(() => {
    const state = location.state as { conversationId?: string } | null;
    if (state?.conversationId) {
      setActiveConversationId(state.conversationId);
      // Limpar state para não abrir novamente ao navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const isClient = user?.role === 'client';
  const isOperator = user?.role === 'operator';
  const isAdmin = user?.role === 'admin';

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const handleNewConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowUserSelector(false);
  };

  return (
    <Layout title="Chat">
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex-1 flex overflow-hidden">
          {/* Sidebar - Lista de Conversas */}
          <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
            {/* Header da Sidebar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiChat className="text-purple-600" size={24} />
                  {isOperator ? 'Chats de Pedidos' : isAdmin ? 'Todas as Conversas' : 'Conversas'}
                </h2>
                {/* Apenas clientes e admins podem criar conversas diretamente */}
                {(isClient || isAdmin) && (
                  <button
                    onClick={() => setShowUserSelector(true)}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    title="Nova conversa"
                  >
                    <HiPlus size={20} />
                  </button>
                )}
              </div>
              {isOperator && (
                <p className="text-sm text-gray-600">
                  Visualize e responda conversas relacionadas a pedidos
                </p>
              )}
              {/* Filtros para Administrador */}
              {isAdmin && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Filtrar por:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        filter === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFilter('orders')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        filter === 'orders'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Pedidos
                    </button>
                    <button
                      onClick={() => setFilter('operator-admin')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        filter === 'operator-admin'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Operador-Admin
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-hidden">
              {chatError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 m-4 rounded">
                  <div className="flex items-center gap-2">
                    <HiExclamationCircle className="text-red-500" size={20} />
                    <div>
                      <p className="font-semibold text-red-800">Erro ao carregar conversas</p>
                      <p className="text-sm text-red-600">{chatError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                      >
                        Recarregar página
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <ConversationsList
                onSelectConversation={handleSelectConversation}
                activeConversationId={activeConversationId}
                filter={isAdmin ? filter : undefined}
              />
            </div>
          </div>

          {/* Área Principal - Chat Window */}
          <div className="flex-1 flex flex-col">
            {activeConversationId ? (
              <div className="flex-1 flex flex-col h-full">
                <ChatWindow
                  conversationId={activeConversationId}
                  onClose={() => setActiveConversationId(null)}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <HiChat size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isOperator 
                      ? 'Selecione uma conversa de pedido para começar'
                      : 'Escolha uma conversa da lista ou inicie uma nova'
                    }
                  </p>
                  {(isClient || isAdmin) && (
                    <button
                      onClick={() => setShowUserSelector(true)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2 mx-auto"
                    >
                      <HiPlus size={20} />
                      Nova Conversa
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Usuário */}
      {showUserSelector && (
        <UserSelector
          onSelect={handleNewConversation}
          onClose={() => setShowUserSelector(false)}
        />
      )}
    </Layout>
  );
};
