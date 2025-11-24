import { create } from 'zustand';
import type { Conversation, ChatMessage } from '../types';
import { chatApi } from '../services/api';

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
      const conversations = await chatApi.getConversations();
      set({ conversations, loading: false });
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      set({ 
        error: error.response?.data?.detail || 'Erro ao carregar conversas',
        loading: false,
        conversations: [] // Fallback para array vazio
      });
    }
  },
  
  // Load messages from API
  loadMessages: async (conversationId) => {
    try {
      const messages = await chatApi.getMessages(conversationId);
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
      const newMessage = await chatApi.sendMessage(conversationId, message);
      
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
}));


