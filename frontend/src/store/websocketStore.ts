import { create } from 'zustand';
import { orderWebSocketService, type WebSocketMessage } from '../services/websocket';
import { useOrderStore } from './orderStore';
import { useAuthStore } from './authStore';
import { mapOrderFromBackend } from '../services/api';

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  connected: false,
  connecting: false,
  error: null,

  connect: async () => {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.warn('Tentando conectar WebSocket sem token');
      return;
    }

    if (get().connecting || get().connected) {
      return;
    }

    set({ connecting: true, error: null });

    try {
      // Registrar handlers para atualizar pedidos
      orderWebSocketService.on('order_status_update', (message: WebSocketMessage) => {
        if (message.order) {
          try {
            // Mapear pedido do formato do backend para o formato do frontend
            const mappedOrder = mapOrderFromBackend(message.order);
            const { syncOrder } = useOrderStore.getState();
            syncOrder(mappedOrder);
          } catch (error) {
            console.error('Erro ao mapear pedido do WebSocket:', error);
          }
        }
      });

      orderWebSocketService.on('order_created', (message: WebSocketMessage) => {
        if (message.order) {
          try {
            // Mapear pedido do formato do backend para o formato do frontend
            const mappedOrder = mapOrderFromBackend(message.order);
            const { syncOrder } = useOrderStore.getState();
            syncOrder(mappedOrder);
          } catch (error) {
            console.error('Erro ao mapear pedido do WebSocket:', error);
          }
        }
      });

      orderWebSocketService.on('error', (message: WebSocketMessage) => {
        set({ error: message.error || 'Erro na conexão WebSocket' });
      });

      // Conectar
      await orderWebSocketService.connect(token);
      
      set({ connected: true, connecting: false, error: null });
    } catch (error: any) {
      console.error('Erro ao conectar WebSocket:', error);
      set({ 
        connected: false, 
        connecting: false, 
        error: error.message || 'Erro ao conectar WebSocket' 
      });
    }
  },

  disconnect: () => {
    orderWebSocketService.disconnect();
    set({ connected: false, connecting: false, error: null });
  },

  reconnect: async () => {
    get().disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await get().connect();
  },
}));

// Atualizar estado quando conexão mudar
orderWebSocketService.on('*', () => {
  const connected = orderWebSocketService.isConnected();
  useWebSocketStore.setState({ connected });
});

