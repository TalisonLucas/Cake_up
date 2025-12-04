import type { Conversation, ChatMessage } from '../types';
import { clients, operators, admins } from './users';

// ============ MOCK CONVERSATIONS ============
export const mockConversations: Conversation[] = [
  // Conversa 1: Cliente 1 com Operador 1
  {
    id: 'conv1',
    type: 'client-operator',
    status: 'open',
    participants: [
      {
        id: clients[0].id,
        name: clients[0].name,
        role: 'client',
      },
      {
        id: operators[0].id,
        name: operators[0].name,
        role: 'operator',
      },
    ],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    relatedOrderId: 'ord1',
  },
  // Conversa 2: Cliente 2 com Operador 1 (resolvida)
  {
    id: 'conv2',
    type: 'client-operator',
    status: 'resolved',
    participants: [
      {
        id: clients[1].id,
        name: clients[1].name,
        role: 'client',
      },
      {
        id: operators[0].id,
        name: operators[0].name,
        role: 'operator',
      },
    ],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    relatedOrderId: 'ord2',
  },
  // Conversa 3: Operador 1 com Admin 1
  {
    id: 'conv3',
    type: 'operator-admin',
    status: 'open',
    participants: [
      {
        id: operators[0].id,
        name: operators[0].name,
        role: 'operator',
      },
      {
        id: admins[0].id,
        name: admins[0].name,
        role: 'admin',
      },
    ],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

// ============ MOCK MESSAGES ============
export const mockMessages: ChatMessage[] = [
  // Mensagens da Conversa 1
  {
    id: 'msg1',
    conversationId: 'conv1',
    senderId: clients[0].id,
    senderName: clients[0].name,
    senderRole: 'client',
    message: 'Olá! Gostaria de saber se posso alterar meu pedido.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    senderId: operators[0].id,
    senderName: operators[0].name,
    senderRole: 'operator',
    message: 'Olá! Sim, você ainda está dentro do prazo de 2 minutos. O que deseja alterar?',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    senderId: clients[0].id,
    senderName: clients[0].name,
    senderRole: 'client',
    message: 'Quero trocar o recheio de um dos cupcakes para frutas vermelhas.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg4',
    conversationId: 'conv1',
    senderId: operators[0].id,
    senderName: operators[0].name,
    senderRole: 'operator',
    message: 'Perfeito! Já estou fazendo a alteração no seu pedido.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    read: false,
  },
  
  // Mensagens da Conversa 2 (resolvida)
  {
    id: 'msg5',
    conversationId: 'conv2',
    senderId: clients[1].id,
    senderName: clients[1].name,
    senderRole: 'client',
    message: 'Quanto tempo leva para produzir meu pedido?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg6',
    conversationId: 'conv2',
    senderId: operators[0].id,
    senderName: operators[0].name,
    senderRole: 'operator',
    message: 'O tempo médio de produção é de 30-40 minutos.',
    timestamp: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg7',
    conversationId: 'conv2',
    senderId: clients[1].id,
    senderName: clients[1].name,
    senderRole: 'client',
    message: 'Perfeito! Obrigado!',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  
  // Mensagens da Conversa 3 (Operador -> Admin)
  {
    id: 'msg8',
    conversationId: 'conv3',
    senderId: operators[0].id,
    senderName: operators[0].name,
    senderRole: 'operator',
    message: 'Olá! Precisamos de mais ingredientes de chocolate.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg9',
    conversationId: 'conv3',
    senderId: admins[0].id,
    senderName: admins[0].name,
    senderRole: 'admin',
    message: 'Entendido. Vou providenciar a compra ainda hoje.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
  },
];

// ============ HELPER FUNCTIONS ============
export const getMessagesByConversation = (conversationId: string): ChatMessage[] => {
  return mockMessages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const getConversationById = (id: string): Conversation | undefined => {
  return mockConversations.find(c => c.id === id);
};

export const getConversationsByUser = (userId: string): Conversation[] => {
  return mockConversations.filter(c =>
    c.participants.some(p => p.id === userId)
  );
};

export const getUnreadCount = (conversationId: string, userId: string): number => {
  return mockMessages.filter(m =>
    m.conversationId === conversationId &&
    m.senderId !== userId &&
    !m.read
  ).length;
};



