import { create } from 'zustand';
import type { Conversation, ChatMessage } from '../types';
import { chatApi } from '../services/api';

// Helper function to normalize status (handle both uppercase and lowercase)
const normalizeStatus = (status: string | undefined): 'open' | 'resolved' | 'closed' => {
  if (!status) return 'open';
  const statusLower = status.toLowerCase();
  if (statusLower === 'open' || statusLower === 'resolved' || statusLower === 'closed') {
    return statusLower as 'open' | 'resolved' | 'closed';
  }
  return 'open';
};

// Helper function to map conversation from backend to frontend format
const mapConversation = (rawConv: any): Conversation => {
  try {
    if (!rawConv || !rawConv.id) {
      console.error('⚠️ mapConversation: Dados de conversa inválidos:', rawConv);
      throw new Error('Dados de conversa inválidos');
    }

    return {
      id: rawConv.id.toString(),
      type: rawConv.conversation_type === 'CLIENT_ESTABLISHMENT' ? 'client-operator' : 'operator-admin',
      status: normalizeStatus(rawConv.status),
      participants: (rawConv.participants_details || rawConv.participants || []).map((p: any) => ({
        id: (p.id || p)?.toString() || '',
        name: p.full_name || p.username || 'Usuário',
        role: (p.role || 'client').toLowerCase() as 'client' | 'operator' | 'admin',
      })),
      lastMessage: rawConv.last_message ? {
        id: rawConv.last_message.id?.toString() || '',
        conversationId: rawConv.id.toString(),
        senderId: (rawConv.last_message.sender?.toString() || rawConv.last_message.sender_id?.toString() || ''),
        senderName: rawConv.last_message.sender_name || 'Usuário',
        senderRole: (rawConv.last_message.sender_role || 'client').toLowerCase() as 'client' | 'operator' | 'admin',
        message: rawConv.last_message.content || rawConv.last_message.message || '',
        timestamp: rawConv.last_message.timestamp || new Date().toISOString(),
        read: rawConv.last_message.is_read || false,
      } : undefined,
      unreadCount: rawConv.unread_count || 0,
      createdAt: rawConv.created_at || new Date().toISOString(),
      updatedAt: rawConv.updated_at || new Date().toISOString(),
      relatedOrderId: rawConv.order?.toString() || rawConv.order_details?.id?.toString(),
      assignedOperatorId: rawConv.assigned_operator?.toString() || rawConv.assigned_operator_details?.id?.toString(),
      orderDetails: rawConv.order_details,
      assignedOperatorDetails: rawConv.assigned_operator_details,
    };
  } catch (error) {
    console.error('❌ Erro ao mapear conversa:', error, rawConv);
    throw error;
  }
};

interface ChatState {
  conversations: Conversation[];
  messages: { [conversationId: string]: ChatMessage[] };
  activeConversationId: string | null;
  isTyping: { [userId: string]: boolean };
  loading: boolean;
  error: string | null;
  
  // Actions
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (conversationId: string, message: string, senderId: string, senderName: string, senderRole: any) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  createConversation: (conversation: Conversation) => void;
  getUnreadCount: (userId: string) => number;
  createConversationFromOrder: (orderId: string | number) => Promise<Conversation>;
  assignOperator: (conversationId: string, operatorId: string | number) => Promise<void>;
  callAdmin: (conversationId: string) => Promise<Conversation>;
  markResolved: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  isTyping: {},
  loading: false,
  error: null,
  
  // Load conversations from API
  loadConversations: async () => {
    set({ loading: true, error: null });
    try {
      console.log('📥 Carregando conversas...');
      const rawConversations = await chatApi.getConversations();
      console.log('✅ Conversas recebidas da API:', rawConversations);
      
      // Verificar se é um array válido
      if (!Array.isArray(rawConversations)) {
        console.error('⚠️ Resposta da API não é um array:', rawConversations);
        throw new Error('Formato de resposta inválido da API');
      }
      
      // Mapear dados do backend para o formato do frontend
      const conversations = rawConversations.map((conv: any, index: number) => {
        try {
          return mapConversation(conv);
        } catch (error) {
          console.error(`❌ Erro ao mapear conversa ${index}:`, error, conv);
          // Retornar conversa básica em caso de erro no mapeamento
          return {
            id: conv?.id?.toString() || `error-${index}`,
            type: 'client-operator' as const,
            status: 'open' as const,
            participants: [],
            unreadCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }).filter((conv) => conv.id && conv.id !== 'error'); // Filtrar conversas inválidas
      
      console.log('✅ Conversas mapeadas com sucesso:', conversations.length);
      set({ conversations, loading: false, error: null });
    } catch (error: any) {
      console.error('❌ Erro ao carregar conversas:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao carregar conversas';
      set({ 
        error: errorMessage,
        loading: false,
        conversations: [] // Fallback para array vazio
      });
    }
  },
  
  // Load messages from API
  loadMessages: async (conversationId) => {
    try {
      const rawMessages = await chatApi.getMessages(conversationId);
      // Mapear dados do backend para o formato do frontend
      const messages = rawMessages.map((msg: any) => ({
        id: msg.id.toString(),
        conversationId: conversationId,
        senderId: msg.sender?.toString() || msg.sender_id?.toString(),
        senderName: msg.sender_name || msg.sender_username || 'Usuário',
        senderRole: (msg.sender_role || 'client').toLowerCase(),
        message: msg.content || msg.message,
        timestamp: msg.timestamp,
        read: msg.is_read || msg.read || false,
      }));
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: messages,
        },
      }));
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      // Fallback para array vazio
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [],
        },
      }));
    }
  },
  
  // Set active conversation
  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      get().loadMessages(conversationId);
    }
  },
  
  // Send message via API
  sendMessage: async (conversationId, message, senderId, senderName, senderRole) => {
    try {
      const rawMessage = await chatApi.sendMessage(conversationId, message);
      // Mapear dados do backend para o formato do frontend
      const newMessage: ChatMessage = {
        id: rawMessage.id.toString(),
        conversationId: conversationId,
        senderId: rawMessage.sender?.toString() || rawMessage.sender_id?.toString() || senderId,
        senderName: rawMessage.sender_name || rawMessage.sender_username || senderName,
        senderRole: (rawMessage.sender_role || senderRole).toLowerCase(),
        message: rawMessage.content || rawMessage.message || message,
        timestamp: rawMessage.timestamp || new Date().toISOString(),
        read: rawMessage.is_read || false,
      };
      
      // Update local state with the new message
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), newMessage],
        },
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.timestamp }
            : conv
        ),
      }));
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      // Se falhar, ainda adiciona localmente (modo offline)
      const fallbackMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        conversationId,
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), fallbackMessage],
        },
      }));
    }
  },
  
  // Mark messages as read
  markAsRead: (conversationId, userId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(msg =>
          msg.senderId !== userId ? { ...msg, read: true } : msg
        ),
      },
      conversations: state.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    }));
  },
  
  // Set typing indicator
  setTyping: (userId, isTyping) => {
    set((state) => ({
      isTyping: {
        ...state.isTyping,
        [userId]: isTyping,
      },
    }));
  },
  
  // Create new conversation
  createConversation: (conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },
  
  // Get total unread count for user
  getUnreadCount: (userId) => {
    const { conversations, messages } = get();
    return conversations.reduce((total, conv) => {
      const convMessages = messages[conv.id] || [];
      const unread = convMessages.filter(msg => msg.senderId !== userId && !msg.read).length;
      return total + unread;
    }, 0);
  },

  // Create conversation from order
  createConversationFromOrder: async (orderId) => {
    try {
      const rawConversation = await chatApi.createConversationFromOrder(orderId);
      // Mapear dados do backend para o formato do frontend
      const conversation = mapConversation(rawConversation);
      set((state) => ({
        conversations: [conversation, ...state.conversations],
      }));
      return conversation;
    } catch (error: any) {
      console.error('Erro ao criar conversa a partir de pedido:', error);
      throw error;
    }
  },

  // Assign operator to conversation
  assignOperator: async (conversationId, operatorId) => {
    try {
      const rawConversation = await chatApi.assignOperator(conversationId, operatorId);
      const updatedConversation = mapConversation(rawConversation);
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? updatedConversation : conv
        ),
      }));
    } catch (error: any) {
      console.error('Erro ao atribuir operador:', error);
      throw error;
    }
  },

  // Call admin (creates/opens OPERATOR_ADMIN conversation)
  callAdmin: async (conversationId) => {
    try {
      const rawConversation = await chatApi.callAdmin(conversationId);
      const conversation = mapConversation(rawConversation);
      set((state) => {
        const exists = state.conversations.find(c => c.id === conversation.id);
        if (exists) {
          return {
            conversations: state.conversations.map(c =>
              c.id === conversation.id ? conversation : c
            ),
          };
        }
        return {
          conversations: [conversation, ...state.conversations],
        };
      });
      return conversation;
    } catch (error: any) {
      console.error('Erro ao chamar administrador:', error);
      throw error;
    }
  },

  // Mark conversation as resolved
  markResolved: async (conversationId) => {
    try {
      const rawConversation = await chatApi.markResolved(conversationId);
      const updatedConversation = mapConversation(rawConversation);
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? updatedConversation : conv
        ),
      }));
    } catch (error: any) {
      console.error('Erro ao marcar conversa como resolvida:', error);
      throw error;
    }
  },
}));


