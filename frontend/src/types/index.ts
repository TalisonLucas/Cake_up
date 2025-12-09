// ============ USER & AUTH ============
export type UserRole = 'client' | 'operator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isActive?: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  cpf?: string;
}

export interface Address {
  id: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
}

// ============ CUPCAKE SYSTEM ============
export type ComponentType = 'massa' | 'recheio' | 'cobertura';

export interface CupcakeComponent {
  id: string;
  type: ComponentType;
  name: string;
  price: number;
  disponivel: boolean;
  description?: string;
  image?: string;
  estoque?: number;
}

export interface Cupcake {
  id: string;
  massa: CupcakeComponent;
  recheio: CupcakeComponent;
  cobertura: CupcakeComponent;
  quantity: number;
  preco: number; // preço total (soma dos componentes)
  observacoes?: string;
}

// ============ LEGACY PRODUCT (manter compatibilidade) ============
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ============ ORDER SYSTEM ============
export type OrderStatus = 
  | 'aguardando'    // Aguardando confirmação do operador
  | 'aceito'        // Aceito pelo operador
  | 'producao'      // Em produção
  | 'liberado'      // Liberado para entrega
  | 'pago'          // Pago e finalizado
  | 'cancelado';    // Cancelado/recusado

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  operatorId?: string;
  operatorName?: string;
  note?: string;
}

export interface DeliveryCode {
  code: string;
  generatedAt: string;
  expiresAt: string;
  attempts: number;
  validated: boolean;
  validatedAt?: string;
}

export interface Order {
  id: string;
  number: string; // Formato: #CKP2024001234
  status: OrderStatus;
  total: number;
  destination: string;
  items: Cupcake[]; // Array de cupcakes montados
  deliveryCode?: DeliveryCode;
  canEditUntil?: string; // Timestamp: 2 minutos após criação
  createdAt: string;
  updatedAt: string;
  clientId: string;
  clientName: string;
  operatorId?: string;
  operatorName?: string;
  statusHistory: OrderStatusHistory[];
  observacoes?: string;
  enderecoEntrega: Address;
}

// ============ CHAT SYSTEM ============
export type ConversationType = 'client-operator' | 'operator-admin';
export type ConversationStatus = 'open' | 'resolved' | 'closed';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  participants: {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  relatedOrderId?: string;
}

// ============ OPERATOR ============
export interface Operator extends User {
  role: 'operator' | 'admin';
  isActive: boolean;
  ordersHandled: number;
  averageRating: number;
  joinedAt: string;
}

// ============ REPORTS ============
export type ReportType = 
  | 'vendas'
  | 'produtos'
  | 'operadores'
  | 'financeiro'
  | 'clientes';

export type ReportPeriod = 'day' | 'week' | 'month' | 'custom';

export interface ReportFilter {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  status?: OrderStatus[];
  operatorId?: string;
  productId?: string;
  minValue?: number;
  maxValue?: number;
}

export interface SalesReport {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  inProgressOrders: number;
  totalRevenue: number;
  averageTicket: number;
  highestOrder: number;
  lowestOrder: number;
  periodStart: string;
  periodEnd: string;
}

export interface ProductReport {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  averagePrice: number;
}

export interface OperatorReport {
  operatorId: string;
  operatorName: string;
  ordersHandled: number;
  totalRevenue: number;
  averageRating: number;
  satisfactionRate: number;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  filters: ReportFilter;
  data: SalesReport | ProductReport[] | OperatorReport[] | any;
  generatedAt: string;
  generatedBy: string;
}

