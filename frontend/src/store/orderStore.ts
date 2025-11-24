import { create } from 'zustand';
import type { Order, OrderStatus, OrderStatusHistory } from '../types';
import { ordersApi } from '../services/api';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadOrders: () => Promise<void>;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  setCurrentOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, operatorId?: string, operatorName?: string, note?: string) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  
  // Timer helpers
  canEditOrder: (order: Order) => boolean;
  getRemainingEditTime: (order: Order) => number; // seconds remaining
  
  // Status helpers
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPendingOrders: () => Order[];
  getActiveOrders: () => Order[];
  getCompletedOrders: () => Order[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  
  // Load orders from API
  loadOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await ordersApi.getAll();
      // Sort by most recent first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      set({ orders, loading: false });
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      set({ 
        error: error.response?.data?.detail || 'Erro ao carregar pedidos',
        loading: false 
      });
    }
  },
  
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  // Update order status with history
  updateOrderStatus: (orderId, status, operatorId, operatorName, note) => {
    const now = new Date().toISOString();
    
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        
        const newHistoryEntry: OrderStatusHistory = {
          status,
          timestamp: now,
          operatorId,
          operatorName,
          note,
        };
        
        const updatedOrder: Order = {
          ...order,
          status,
          operatorId: operatorId || order.operatorId,
          operatorName: operatorName || order.operatorName,
          updatedAt: now,
          statusHistory: [...order.statusHistory, newHistoryEntry],
        };
        
        // Generate delivery code when status becomes 'liberado'
        if (status === 'liberado' && !updatedOrder.deliveryCode) {
          updatedOrder.deliveryCode = {
            code: Math.floor(100000 + Math.random() * 900000).toString(),
            generatedAt: now,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            attempts: 0,
            validated: false,
          };
        }
        
        return updatedOrder;
      }),
    }));
  },
  
  // Update order with partial data
  updateOrder: (orderId, updates) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, ...updates, updatedAt: new Date().toISOString() }
          : order
      ),
    }));
  },
  
  // Check if order can be edited (within 2 minutes)
  canEditOrder: (order) => {
    if (!order.canEditUntil) return false;
    const now = Date.now();
    const editUntil = new Date(order.canEditUntil).getTime();
    return now < editUntil && order.status === 'aguardando';
  },
  
  // Get remaining edit time in seconds
  getRemainingEditTime: (order) => {
    if (!order.canEditUntil) return 0;
    const now = Date.now();
    const editUntil = new Date(order.canEditUntil).getTime();
    const remaining = Math.max(0, Math.floor((editUntil - now) / 1000));
    return remaining;
  },
  
  // Get orders by status
  getOrdersByStatus: (status) => {
    const { orders } = get();
    return orders.filter(o => o.status === status);
  },
  
  // Get pending orders (aguardando)
  getPendingOrders: () => {
    const { orders } = get();
    return orders.filter(o => o.status === 'aguardando');
  },
  
  // Get active orders (not pago)
  getActiveOrders: () => {
    const { orders } = get();
    return orders.filter(o => o.status !== 'pago');
  },
  
  // Get completed orders (pago)
  getCompletedOrders: () => {
    const { orders } = get();
    return orders.filter(o => o.status === 'pago');
  },
}));

