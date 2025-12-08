import type { Order } from '../types';

// Detectar automaticamente ws:// ou wss:// baseado na URL
const getWebSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) {
    // Se já começa com ws:// ou wss://, usar como está
    if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) {
      return envUrl;
    }
    // Se começa com http://, converter para ws://
    if (envUrl.startsWith('http://')) {
      return envUrl.replace('http://', 'ws://');
    }
    // Se começa com https://, converter para wss://
    if (envUrl.startsWith('https://')) {
      return envUrl.replace('https://', 'wss://');
    }
    // Se não tem protocolo, adicionar ws:// ou wss:// baseado na origem
    const isSecure = window.location.protocol === 'https:';
    return `${isSecure ? 'wss://' : 'ws://'}${envUrl}`;
  }
  
  // Fallback: usar localhost com protocolo baseado na origem
  const isSecure = window.location.protocol === 'https:';
  return `${isSecure ? 'wss://' : 'ws://'}localhost:8000`;
};

const WS_BASE_URL = getWebSocketUrl();

export interface WebSocketMessage {
  type: 'order_status_update' | 'order_created' | 'error' | 'ping' | 'pong' | 'connection_success';
  order?: Order;
  message?: string;
  error?: string;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class OrderWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 segundos
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    this.url = `${WS_BASE_URL}/ws/orders/`;
  }

  /**
   * Conecta ao WebSocket com autenticação JWT
   */
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
        // Conectar com token na query string
        const wsUrl = `${this.url}?token=${token}`;
        console.log('🔗 Conectando WebSocket para:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket handshake completo - aguardando autenticação do servidor...');
          // Não resolver ainda - esperar mensagem de connection_success do servidor
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            // Tratar mensagens de erro do servidor
            if (message.type === 'error') {
              console.error('Erro do servidor WebSocket:', message.error);
              this.emit('error', message);
              this.isConnecting = false;
              reject(new Error(message.error || 'Erro desconhecido'));
              return;
            }
            
            // Tratar mensagem de sucesso na conexão
            if (message.type === 'connection_success') {
              console.log('WebSocket conectado com sucesso:', message.message);
              this.isConnecting = false;
              this.reconnectAttempts = 0;
              this.startPingInterval();
              resolve();
              return;
            }
            
            this.handleMessage(message);
          } catch (error) {
            console.error('Erro ao processar mensagem WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Erro WebSocket:', error);
          this.isConnecting = false;
          // Não rejeitar imediatamente, esperar onclose para ver o código
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket desconectado', event.code, event.reason);
          this.isConnecting = false;
          this.stopPingInterval();
          
          // Códigos de erro comuns:
          // 1000 = Normal closure (fechado intencionalmente)
          // 1006 = Abnormal closure (sem handshake completo ou conexão perdida)
          // 4001 = Unauthorized
          // 4002 = Internal Error
          
          // Se foi fechado normalmente, não fazer nada (já foi resolvido)
          if (event.code === 1000) {
            return;
          }
          
          if (event.code === 4001) {
            console.error('WebSocket: Autenticação falhou');
            this.emit('error', { type: 'error', error: 'Autenticação falhou. Faça login novamente.' });
            reject(new Error('Autenticação falhou'));
            return;
          }
          
          if (event.code === 4002) {
            console.error('WebSocket: Erro interno do servidor');
            this.emit('error', { type: 'error', error: 'Erro interno do servidor' });
            reject(new Error('Erro interno do servidor'));
            return;
          }
          
          // Para código 1006 ou outros erros, tentar reconectar
          // Não rejeitar imediatamente - deixar o scheduleReconnect lidar com isso
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          } else {
            // Se não deve reconectar e código é 1006, pode ser apenas cleanup do React
            // Não rejeitar a promise nesse caso para evitar erros desnecessários
            if (event.code !== 1006) {
              reject(new Error(`Conexão fechada com código ${event.code}`));
            } else {
              console.log('WebSocket fechado com código 1006 durante cleanup - ignorando');
            }
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPingInterval();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      // Só fechar se a conexão estiver aberta ou conectando
      // Se estiver fechada ou nunca foi estabelecida, apenas limpar a referência
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        try {
          this.ws.close(1000, 'Desconexão intencional');
        } catch (error) {
          console.warn('Erro ao fechar WebSocket:', error);
        }
      }
      this.ws = null;
    }
    
    this.isConnecting = false;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Agenda reconexão
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Número máximo de tentativas de reconexão atingido');
      this.emit('error', { type: 'error', error: 'Falha ao reconectar WebSocket' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.token && this.shouldReconnect) {
        this.connect(this.token).catch((error) => {
          console.error('Erro ao reconectar:', error);
        });
      }
    }, delay);
  }

  /**
   * Inicia intervalo de ping para manter conexão viva
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping a cada 30 segundos
  }

  /**
   * Para intervalo de ping
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Envia mensagem para o servidor
   */
  private send(message: Partial<WebSocketMessage>): void {
    if (this.isConnected() && this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Processa mensagem recebida
   */
  private handleMessage(message: WebSocketMessage): void {
    // Responder a pings
    if (message.type === 'ping') {
      this.send({ type: 'pong' });
      return;
    }

    // Emitir evento para handlers registrados
    this.emit(message.type, message);
  }

  /**
   * Registra handler para um tipo de mensagem
   */
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Retorna função para remover handler
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Remove handler
   */
  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emite evento para todos os handlers registrados
   */
  private emit(eventType: string, message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao executar handler WebSocket:', error);
        }
      });
    }

    // Emitir também para handlers genéricos ('*')
    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao executar handler genérico WebSocket:', error);
        }
      });
    }
  }
}

// Instância singleton
export const orderWebSocketService = new OrderWebSocketService();

