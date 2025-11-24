import { create } from 'zustand';
import type { Conversation, ChatMessage } from '../types';
import { mockConversations, mockMessages, getMessagesByConversation } from '../mocks/messages';

interface ChatState {
  conversations: Conversation[];
  messages: { [conversationId: string]: ChatMessage[] };
  activeConversationId: string | null;
  isTyping: { [userId: string]: boolean };
  
  // Actions
  loadConversations: (userId: string) => void;
  loadMessages: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (conversationId: string, message: string, senderId: string, senderName: string, senderRole: any) => void;
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
  
  // Load conversations for a user
  loadConversations: (userId) => {
    const userConversations = mockConversations.filter(conv =>
      conv.participants.some(p => p.id === userId)
    );
    set({ conversations: userConversations });
  },
  
  // Load messages for a conversation
  loadMessages: (conversationId) => {
    const conversationMessages = getMessagesByConversation(conversationId);
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: conversationMessages,
      },
    }));
  },
  
  // Set active conversation
  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      get().loadMessages(conversationId);
    }
  },
  
  // Send message
  sendMessage: (conversationId, message, senderId, senderName, senderRole) => {
    const newMessage: ChatMessage = {
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
        [conversationId]: [...(state.messages[conversationId] || []), newMessage],
      },
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.timestamp }
          : conv
      ),
    }));
    
    // Simulate response after 2 seconds (for testing)
    setTimeout(() => {
      const conv = get().conversations.find(c => c.id === conversationId);
      if (!conv) return;
      
      const otherParticipant = conv.participants.find(p => p.id !== senderId);
      if (!otherParticipant) return;
      
      const responseMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        conversationId,
        senderId: otherParticipant.id,
        senderName: otherParticipant.name,
        senderRole: otherParticipant.role,
        message: 'Obrigado pela mensagem! Em breve responderemos.',
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), responseMessage],
        },
      }));
    }, 2000);
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

