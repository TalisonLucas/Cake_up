import { useState, useEffect, useRef } from 'react';
import { HiX, HiPaperAirplane } from 'react-icons/hi';
import type { ChatMessage } from '../../types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
}

export const ChatWindow = ({ conversationId, onClose }: ChatWindowProps) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const { messages, sendMessage, markAsRead, loadMessages } = useChatStore();
  
  const conversationMessages = messages[conversationId] || [];

  useEffect(() => {
    loadMessages(conversationId);
    if (user) {
      markAsRead(conversationId, user.id);
    }
  }, [conversationId, loadMessages, markAsRead, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user) return;

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

  // Removido: função não estava sendo utilizada

  return (
    <div className="fixed bottom-0 right-0 md:right-4 md:bottom-4 w-full md:w-96 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 flex flex-col h-[500px] md:h-[600px] z-50">
      {/* Header */}
      <div className="bg-cake-pink p-4 rounded-t-2xl flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-cake-text">💬 Chat</h3>
          <p className="text-xs text-cake-text opacity-80">
            Atendimento Cake Up
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cake-dark-pink rounded-lg transition-colors"
          aria-label="Fechar"
        >
          <HiX size={20} />
        </button>
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
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-cake-pink outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-3 bg-cake-pink hover:bg-cake-dark-pink rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            <HiPaperAirplane size={20} className="text-cake-text" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-cake-pink text-cake-text rounded-br-none'
            : 'bg-white text-cake-text rounded-bl-none shadow-sm'
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-medium text-gray-600 mb-1">
            {message.senderName}
          </p>
        )}
        <p className="text-sm">{message.message}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-right opacity-70' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};


