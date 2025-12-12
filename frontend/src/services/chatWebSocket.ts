// Detectar automaticamente ws:// ou wss:// baseado na URL
const getWebSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) {
    if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) {
      return envUrl;
    }
    if (envUrl.startsWith('http://')) {
      return envUrl.replace('http://', 'ws://');
    }
    if (envUrl.startsWith('https://')) {
      return envUrl.replace('https://', 'wss://');
    }
    const isSecure = window.location.protocol === 'https:';
    return `${isSecure ? 'wss://' : 'ws://'}${envUrl}`;
  }
  
  const isSecure = window.location.protocol === 'https:';
  return `${isSecure ? 'wss://' : 'ws://'}localhost:8000`;
};

const WS_BASE_URL = getWebSocketUrl();

export interface ChatWebSocketMessage {
  type: 'new_message' | 'message_read' | 'error' | 'ping' | 'pong' | 'connection_success' | 'joined_conversation';
  message?: any;
  conversation_id?: string;
  message_id?: string;
  error?: string;
}

export type ChatWebSocketEventHandler = (message: ChatWebSocketMessage) => void;

export class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Map<string, Set<ChatWebSocketEventHandler>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;
  private joinedConversations: Set<string> = new Set();

  constructor() {
    this.url = `${WS_BASE_URL}/ws/chat/`;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.token = token;
      this.isConnecting = true;
      this.shouldReconnect = true;

      try {
        const wsUrl = `${this.url}?token=${token}`;
        console.log('🔗 Conectando Chat WebSocket para:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Chat WebSocket handshake completo - aguardando autenticação...');
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ChatWebSocketMessage = JSON.parse(event.data);
            
            if (message.type === 'error') {
              console.error('Erro do servidor Chat WebSocket:', message.error);
              this.emit('error', message);
              this.isConnecting = false;
              reject(new Error(message.error || 'Erro desconhecido'));
              return;
            }
            
            if (message.type === 'connection_success') {
              console.log('Chat WebSocket conectado com sucesso:', message.error || message.type);
              this.isConnecting = false;
              this.reconnectAttempts = 0;
              this.startPingInterval();
              resolve();
              return;
            }
            
            this.handleMessage(message);
          } catch (error) {
            console.error('Erro ao processar mensagem Chat WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Erro Chat WebSocket:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = (event) => {
          console.log('Chat WebSocket desconectado', event.code, event.reason);
          this.isConnecting = false;
          this.stopPingInterval();
          this.joinedConversations.clear();
          
          if (event.code === 1000) {
            return;
          }
          
          if (event.code === 4001) {
            console.error('Chat WebSocket: Autenticação falhou');
            this.emit('error', { type: 'error', error: 'Autenticação falhou. Faça login novamente.' });
            reject(new Error('Autenticação falhou'));
            return;
          }
          
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPingInterval();
    this.joinedConversations.clear();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        try {
          this.ws.close(1000, 'Desconexão intencional');
        } catch (error) {
          console.warn('Erro ao fechar Chat WebSocket:', error);
        }
      }
      this.ws = null;
    }
    
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  joinConversation(conversationId: string): void {
    if (!this.isConnected()) {
      console.warn('Chat WebSocket não está conectado');
      return;
    }

    if (this.joinedConversations.has(conversationId)) {
      return; // Já está no grupo
    }

    this.send({
      type: 'join_conversation',
      conversation_id: conversationId,
    } as any);
  }

  leaveConversation(conversationId: string): void {
    if (!this.isConnected()) {
      return;
    }

    if (!this.joinedConversations.has(conversationId)) {
      return; // Não está no grupo
    }

    this.send({
      type: 'leave_conversation',
      conversation_id: conversationId,
    } as any);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Número máximo de tentativas de reconexão Chat WebSocket atingido');
      this.emit('error', { type: 'error', error: 'Falha ao reconectar Chat WebSocket' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Tentando reconectar Chat WebSocket em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.token && this.shouldReconnect) {
        this.connect(this.token).catch((error) => {
          console.error('Erro ao reconectar Chat WebSocket:', error);
        });
      }
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' } as any);
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private send(message: Partial<ChatWebSocketMessage>): void {
    if (this.isConnected() && this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: ChatWebSocketMessage): void {
    if (message.type === 'ping') {
      this.send({ type: 'pong' });
      return;
    }

    if (message.type === 'joined_conversation' && message.conversation_id) {
      this.joinedConversations.add(message.conversation_id);
    }

    this.emit(message.type, message);
  }

  on(eventType: string, handler: ChatWebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  off(eventType: string, handler: ChatWebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(eventType: string, message: ChatWebSocketMessage): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao executar handler Chat WebSocket:', error);
        }
      });
    }

    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao executar handler genérico Chat WebSocket:', error);
        }
      });
    }
  }
}

// Instância singleton
export const chatWebSocketService = new ChatWebSocketService();
