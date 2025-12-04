import axios from 'axios';
import type { User, Product, Order, Address, OrderStatus, Cupcake } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Interceptor para lidar com erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (usernameOrEmail: string, password: string) => {
    // Detectar se é email ou username
    const isEmail = usernameOrEmail.includes('@');
    const payload = isEmail 
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };
    
    const response = await api.post<{ access: string; refresh: string }>('/auth/login/', payload);
    const { access, refresh } = response.data;
    
    // Buscar perfil do usuário com o token
    const userProfile = await authApi.me(access);
    
    return {
      user: userProfile,
      token: access,
      refreshToken: refresh,
    };
  },

  register: async (name: string, username: string, email: string, password: string, phone?: string) => {
    // Criar o usuário
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    await api.post('/auth/register/', {
      username,
      email,
      password,
      password2: password,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    
    // Fazer login automático após registro
    return authApi.login(username, password);
  },

  me: async (token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await api.get<any>('/auth/profile/', config);
    // Mapear resposta do backend para o formato do frontend
    return {
      id: response.data.id.toString(),
      name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username,
      email: response.data.email,
      phone: response.data.phone,
      role: response.data.role.toLowerCase() as 'client' | 'operator' | 'admin',
      avatar: response.data.avatar,
      createdAt: response.data.created_at,
    } as User;
  },
};

// Products endpoints
export const productsApi = {
  getAll: async () => {
    const response = await api.get<{ results: any[] }>('/products/products/');
    // Converter price de string para number
    return response.data.results.map((product: any) => ({
      ...product,
      price: parseFloat(product.price),
    })) as Product[];
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`/products/products/${id}/`);
    // Converter price de string para number
    return {
      ...response.data,
      price: parseFloat(response.data.price),
    } as Product;
  },
};

// Helpers para mapear status entre backend (Django) e frontend
const mapBackendStatusToFrontend = (status: string): OrderStatus => {
  switch (status) {
    case 'AGUARDANDO_CONFIRMACAO':
      return 'aguardando';
    case 'ACEITO':
      return 'aceito';
    case 'EM_PRODUCAO':
      return 'producao';
    case 'LIBERADO':
      return 'liberado';
    case 'PAGO':
      return 'pago';
    case 'CANCELADO':
      return 'cancelado';
    default:
      return 'aguardando';
  }
};

const mapFrontendStatusToBackend = (status: OrderStatus): string => {
  switch (status) {
    case 'aguardando':
      return 'AGUARDANDO_CONFIRMACAO';
    case 'aceito':
      return 'ACEITO';
    case 'producao':
      return 'EM_PRODUCAO';
    case 'liberado':
      return 'LIBERADO';
    case 'pago':
      return 'PAGO';
    case 'cancelado':
      return 'CANCELADO';
  }
};

// Helper para mapear pedido do backend para o frontend
export const mapOrderFromBackend = (backendOrder: any): Order => {
  if (!backendOrder) {
    throw new Error('Resposta vazia ao mapear pedido do backend.');
  }

  // Tentar obter um identificador seguro, mesmo que venha como string ou outro campo
  const rawId =
    backendOrder.id ??
    backendOrder.pk ??
    backendOrder.order_id ??
    backendOrder.uuid ??
    Date.now();

  const idStr = rawId.toString();

  return {
    id: idStr,
    number: backendOrder.number
      ? backendOrder.number
      : `#CKP${idStr.padStart(10, '0')}`,
    status: mapBackendStatusToFrontend(backendOrder.status),
    total: parseFloat(backendOrder.total),
    destination: `${backendOrder.delivery_street}, ${backendOrder.delivery_number} - ${backendOrder.delivery_city}/${backendOrder.delivery_state}`,
    items: [], // TODO: Mapear items quando necessário
    deliveryCode: backendOrder.delivery_code
      ? {
          code: backendOrder.delivery_code.code,
          generatedAt: backendOrder.delivery_code.generated_at,
          expiresAt: backendOrder.delivery_code.expires_at,
          attempts: backendOrder.delivery_code.attempts,
          validated: backendOrder.delivery_code.validated,
          validatedAt: backendOrder.delivery_code.validated_at,
        }
      : undefined,
    canEditUntil: backendOrder.alterable_until || 
      (backendOrder.created_at 
        ? new Date(new Date(backendOrder.created_at).getTime() + 5 * 60 * 1000).toISOString()
        : undefined),
    createdAt: backendOrder.created_at,
    updatedAt: backendOrder.updated_at,
    clientId: backendOrder.user?.toString?.() ?? '',
    clientName: backendOrder.user_name || 'Cliente',
    statusHistory: [], // TODO: Mapear histórico quando necessário
    observacoes: backendOrder.observations,
    enderecoEntrega: {
      id: backendOrder.id.toString(),
      cep: backendOrder.delivery_zipcode || '',
      street: backendOrder.delivery_street,
      number: backendOrder.delivery_number,
      district: backendOrder.delivery_neighborhood,
      city: backendOrder.delivery_city,
      state: backendOrder.delivery_state,
    },
  };
};

// Orders endpoints
export const ordersApi = {
  getAll: async () => {
    const response = await api.get<{ results: any[] }>('/orders/orders/');
    return response.data.results.map(mapOrderFromBackend);
  },

  getById: async (id: string) => {
    const response = await api.get<any>(`/orders/orders/${id}/`);
    return mapOrderFromBackend(response.data);
  },

  /**
   * Cria um pedido no backend a partir dos cupcakes montados no carrinho.
   * Usa o serializer OrderCreateSerializer do Django.
   */
  create: async (cart: Cupcake[], address: Partial<Address>, observations?: string) => {
    const items = cart.map((cupcake) => ({
      product_type: 'CUSTOM_CUPCAKE',
      product: null,
      custom_cupcake_data: {
        massa_id: cupcake.massa.id,
        massa_details: cupcake.massa,
        recheio_id: cupcake.recheio.id,
        recheio_details: cupcake.recheio,
        cobertura_id: cupcake.cobertura.id,
        cobertura_details: cupcake.cobertura,
      },
      quantity: cupcake.quantity,
      unit_price: cupcake.preco,
    }));

    const payload = {
      delivery_street: address.street,
      delivery_number: address.number,
      delivery_complement: '',
      delivery_neighborhood: address.district,
      delivery_city: address.city,
      delivery_state: address.state,
      delivery_zipcode: address.cep,
      observations: observations || '',
      items,
    };

    const response = await api.post<any>('/orders/orders/', payload);
    return mapOrderFromBackend(response.data);
  },

  updateStatus: async (orderId: string, newStatus: OrderStatus) => {
    const response = await api.post(`/orders/orders/${orderId}/update_status/`, {
      status: mapFrontendStatusToBackend(newStatus),
    });
    return mapOrderFromBackend(response.data);
  },

  cancel: async (orderId: string) => {
    // Endpoint de cancelamento do backend retorna apenas uma mensagem
    await api.post(`/orders/orders/${orderId}/cancel/`);
  },

  validateDeliveryCode: async (orderId: string, code: string) => {
    const response = await api.post(`/orders/orders/${orderId}/validate_delivery_code/`, {
      code,
    });
    return response.data;
  },
};

// Cupcake Components endpoints
export const cupcakeComponentsApi = {
  getAll: async () => {
    const response = await api.get<{ results: any[] }>('/products/cupcake-components/');
    return response.data.results.map((component: any) => ({
      id: component.id.toString(),
      type: component.type.toLowerCase() as 'massa' | 'recheio' | 'cobertura',
      name: component.name,
      price: parseFloat(component.price),
      disponivel: component.is_available,
      description: component.description,
      image: component.image,
      estoque: 100, // Default estoque
    }));
  },

  getByType: async (type: 'massa' | 'recheio' | 'cobertura') => {
    const components = await cupcakeComponentsApi.getAll();
    return components.filter((c: any) => c.type === type);
  },
};

// Chat endpoints
export const chatApi = {
  getConversations: async () => {
    const response = await api.get<{ results: any[] }>('/chat/conversations/');
    return response.data.results || [];
  },

  getMessages: async (conversationId: string) => {
    const response = await api.get<{ results: any[] }>(`/chat/conversations/${conversationId}/messages/`);
    return response.data.results || [];
  },

  sendMessage: async (conversationId: string, message: string) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages/`, {
      message,
    });
    return response.data;
  },

  createConversation: async (type: string, participantIds: string[]) => {
    const response = await api.post('/chat/conversations/', {
      type,
      participants: participantIds,
    });
    return response.data;
  },
};

// Address endpoints
export const addressApi = {
  getAll: async () => {
    const response = await api.get<{ results: Address[] }>('/auth/addresses/');
    return response.data.results || response.data; // Compatibilidade com paginação
  },

  create: async (address: Omit<Address, 'id'>) => {
    const response = await api.post<Address>('/auth/addresses/', address);
    return response.data;
  },

  update: async (id: string, address: Partial<Address>) => {
    const response = await api.put<Address>(`/auth/addresses/${id}/`, address);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/auth/addresses/${id}/`);
  },
};

// ViaCEP integration
export const viaCepApi = {
  getByCep: async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
    return response.data;
  },
};

// Reports endpoints (Operator/Admin only)
export const reportsApi = {
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard/');
    return response.data;
  },

  getSalesReport: async (period: number = 7) => {
    const response = await api.get(`/reports/sales/?period=${period}`);
    return response.data;
  },

  getProductsReport: async () => {
    const response = await api.get('/reports/products/');
    return response.data;
  },

  getCustomersStats: async () => {
    const response = await api.get('/reports/customers/');
    return response.data;
  },
};

export default api;
