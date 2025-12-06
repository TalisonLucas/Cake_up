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
    
    console.log('🔌 Tentando conectar WebSocket...', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      alreadyConnecting: get().connecting,
      alreadyConnected: get().connected
    });
    
    if (!token) {
      console.warn('⚠️ Tentando conectar WebSocket sem token');
      return;
    }

    if (get().connecting || get().connected) {
      console.log('⏭️ WebSocket já está conectando ou conectado, pulando...');
      return;
    }

    set({ connecting: true, error: null });

    try {
      // Registrar handlers para atualizar pedidos
      orderWebSocketService.on('order_status_update', (message: WebSocketMessage) => {
        if (message.order) {
          try {
            console.log('📨 WebSocket: order_status_update recebido', {
              orderId: message.order.id,
              statusBackend: message.order.status, // Status no formato backend
              message: message.message,
              orderData: message.order, // Dados completos para debug
            });
            
            // Verificar status antes do mapeamento
            const statusAntesMapeamento = message.order.status;
            
            // Mapear pedido do formato do backend para o formato do frontend
            const mappedOrder = mapOrderFromBackend(message.order);
            
            console.log('🔄 Sincronizando pedido no store:', {
              orderId: mappedOrder.id,
              statusBackend: statusAntesMapeamento,
              statusFrontend: mappedOrder.status, // Status após mapeamento
              itemsCount: mappedOrder.items.length,
              orderCompleto: mappedOrder, // Dados completos para debug
            });
            
            // Verificar se o pedido já existe no store antes de sincronizar
            const { orders: currentOrders, syncOrder } = useOrderStore.getState();
            const existingOrder = currentOrders.find(o => o.id === mappedOrder.id);
            
            if (existingOrder) {
              console.log('📋 Pedido existente no store:', {
                orderId: existingOrder.id,
                statusAtual: existingOrder.status,
                novoStatus: mappedOrder.status,
                statusMudou: existingOrder.status !== mappedOrder.status,
              });
            } else {
              console.log('➕ Pedido não encontrado no store - será adicionado');
            }
            
            syncOrder(mappedOrder);
            
            // Verificar se foi atualizado corretamente
            const { orders: updatedOrders } = useOrderStore.getState();
            const updatedOrder = updatedOrders.find(o => o.id === mappedOrder.id);
            
            console.log('✅ Pedido sincronizado:', {
              orderId: mappedOrder.id,
              statusNoStore: updatedOrder?.status,
              totalOrders: updatedOrders.length,
              statusCorreto: updatedOrder?.status === mappedOrder.status,
            });
          } catch (error) {
            console.error('❌ Erro ao processar order_status_update:', error);
            console.error('Dados recebidos:', message.order);
            console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
          }
        } else {
          console.warn('⚠️ order_status_update recebido sem dados de pedido');
        }
      });

      orderWebSocketService.on('order_created', (message: WebSocketMessage) => {
        if (message.order) {
          try {
            console.log('📨 WebSocket: order_created recebido', {
              orderId: message.order.id,
              status: message.order.status,
              message: message.message,
            });
            
            // Mapear pedido do formato do backend para o formato do frontend
            const mappedOrder = mapOrderFromBackend(message.order);
            
            console.log('🔄 Adicionando novo pedido ao store:', {
              orderId: mappedOrder.id,
              status: mappedOrder.status,
              itemsCount: mappedOrder.items.length,
            });
            
            const { syncOrder } = useOrderStore.getState();
            syncOrder(mappedOrder);
            
            console.log('✅ Novo pedido adicionado com sucesso:', mappedOrder.id);
          } catch (error) {
            console.error('❌ Erro ao processar order_created:', error);
            console.error('Dados recebidos:', message.order);
          }
        } else {
          console.warn('⚠️ order_created recebido sem dados de pedido');
        }
      });

      orderWebSocketService.on('error', (message: WebSocketMessage) => {
        console.error('❌ Erro do WebSocket:', message.error);
        set({ error: message.error || 'Erro na conexão WebSocket' });
      });

      // Conectar
      console.log('📡 Chamando orderWebSocketService.connect()...');
      await orderWebSocketService.connect(token);
      console.log('✅ WebSocket conectado com sucesso!');
      
      set({ connected: true, connecting: false, error: null });
    } catch (error: any) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      set({ 
        connected: false, 
        connecting: false, 
        error: error.message || 'Erro ao conectar WebSocket' 
      });
    }
  },

  disconnect: () => {
    const state = get();
    // Só desconectar se realmente está conectado ou conectando
    if (state.connected || state.connecting) {
      orderWebSocketService.disconnect();
      set({ connected: false, connecting: false, error: null });
    }
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

