import axios from 'axios';
import type { User, Product, Order, Address, OrderStatus, Cupcake, CupcakeComponent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Log da URL base para debug
console.log('🔧 API Base URL:', API_BASE_URL);

// Verificar se está usando ngrok
const isNgrok = API_BASE_URL && (API_BASE_URL.includes('ngrok-free.dev') || API_BASE_URL.includes('ngrok.io'));

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Adicionar header para pular aviso do ngrok se necessário
    ...(isNgrok && { 'ngrok-skip-browser-warning': 'true' }),
  },
  timeout: 10000, // 10 segundos de timeout
});

// Adicionar header para pular aviso do ngrok se a URL base contém ngrok
if (API_BASE_URL && (API_BASE_URL.includes('ngrok-free.dev') || API_BASE_URL.includes('ngrok.io'))) {
  api.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
}

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  console.log('📤 Requisição sendo enviada:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
  });
  
  // Só adicionar token do localStorage se não houver um token já definido no header
  // Isso evita sobrescrever tokens passados explicitamente (ex: durante o login)
  if (!config.headers.Authorization) {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('❌ Erro ao ler auth-storage:', error);
        // Se houver erro ao ler o storage, limpar para evitar problemas
        localStorage.removeItem('auth-storage');
      }
    }
  }
  
  // Garantir que header do ngrok está sempre presente se usando ngrok
  if (API_BASE_URL && (API_BASE_URL.includes('ngrok-free.dev') || API_BASE_URL.includes('ngrok.io'))) {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  
  return config;
});

// Interceptor para lidar com erros
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta recebida:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    // Log de erros para debug
    if (error.response) {
      console.error('❌ Erro na resposta da API:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
      });
    } else if (error.request) {
      console.error('❌ Erro de rede - requisição não chegou ao servidor:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        message: error.message,
        code: error.code,
      });
      console.error('Detalhes do erro:', error);
    } else {
      console.error('❌ Erro ao configurar requisição:', error.message);
    }
    
    if (error.response?.status === 401) {
      // Token inválido ou expirado - só redirecionar se não estiver na página de login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (usernameOrEmail: string, password: string) => {
    // O backend sempre espera o campo 'username', mesmo que o valor seja um email
    // O serializer customizado do backend trata a conversão internamente
    const payload = { username: usernameOrEmail, password };
    
    console.log('🔐 Tentando fazer login:', {
      url: `${API_BASE_URL}/auth/login/`,
      payload: { ...payload, password: '***' },
    });
    
    try {
      const response = await api.post<{ access: string; refresh: string }>('/auth/login/', payload);
      const { access, refresh } = response.data;
      
      // Buscar perfil do usuário com o token
      const userProfile = await authApi.me(access);
      
      return {
        user: userProfile,
        token: access,
        refreshToken: refresh,
      };
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
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
  // Converter para maiúsculas para garantir compatibilidade (backend pode enviar em minúsculas ou maiúsculas)
  const statusUpper = status.toUpperCase();
  
  switch (statusUpper) {
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
      console.warn(`⚠️ Status desconhecido recebido do backend: "${status}" (convertido para "${statusUpper}") - usando 'aguardando' como padrão`);
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

// Helper para mapear componente de cupcake do backend para o frontend
const mapCupcakeComponent = (component: any): CupcakeComponent => {
  if (!component) {
    throw new Error('Componente de cupcake não fornecido');
  }
  
  return {
    id: component.id?.toString() || component.pk?.toString() || '',
    type: component.type?.toLowerCase() as 'massa' | 'recheio' | 'cobertura',
    name: component.name || 'Componente',
    price: parseFloat(component.price || 0),
    disponivel: component.is_available !== false,
    description: component.description || '',
    image: component.image || undefined,
    estoque: component.estoque || 100,
  };
};

// Helper para mapear item do pedido para Cupcake
const mapOrderItemToCupcake = (item: any): Cupcake => {
  if (item.product_type === 'CUSTOM_CUPCAKE' && item.custom_cupcake_data) {
    // Cupcake personalizado
    const cupcakeData = item.custom_cupcake_data;
    
    // Tentar usar details se disponível, senão criar estrutura básica
    const massa = cupcakeData.massa_details 
      ? mapCupcakeComponent({ ...cupcakeData.massa_details, type: 'MASSA' })
      : {
          id: cupcakeData.massa_id?.toString() || '',
          type: 'massa' as const,
          name: 'Massa',
          price: 0,
          disponivel: true,
          description: '',
        };
    
    const recheio = cupcakeData.recheio_details
      ? mapCupcakeComponent({ ...cupcakeData.recheio_details, type: 'RECHEIO' })
      : {
          id: cupcakeData.recheio_id?.toString() || '',
          type: 'recheio' as const,
          name: 'Recheio',
          price: 0,
          disponivel: true,
          description: '',
        };
    
    const cobertura = cupcakeData.cobertura_details
      ? mapCupcakeComponent({ ...cupcakeData.cobertura_details, type: 'COBERTURA' })
      : {
          id: cupcakeData.cobertura_id?.toString() || '',
          type: 'cobertura' as const,
          name: 'Cobertura',
          price: 0,
          disponivel: true,
          description: '',
        };
    
    // Calcular preço total (soma dos componentes * quantidade)
    const precoUnitario = parseFloat(massa.price) + parseFloat(recheio.price) + parseFloat(cobertura.price);
    const precoTotal = precoUnitario * (item.quantity || 1);
    
    return {
      id: item.id?.toString() || `cupcake-${Date.now()}`,
      massa,
      recheio,
      cobertura,
      quantity: item.quantity || 1,
      preco: precoTotal || parseFloat(item.unit_price || 0) * (item.quantity || 1),
      observacoes: item.observacoes,
    };
  } else if (item.product && item.product_details) {
    // Produto pronto - converter para formato Cupcake básico
    const product = item.product_details;
    return {
      id: item.id?.toString() || `product-${Date.now()}`,
      massa: {
        id: 'default',
        type: 'massa' as const,
        name: product.name || 'Produto Pronto',
        price: 0,
        disponivel: true,
        description: product.description || '',
        image: product.image,
      },
      recheio: {
        id: 'default',
        type: 'recheio' as const,
        name: 'Produto Pronto',
        price: 0,
        disponivel: true,
        description: '',
      },
      cobertura: {
        id: 'default',
        type: 'cobertura' as const,
        name: 'Produto Pronto',
        price: 0,
        disponivel: true,
        description: '',
      },
      quantity: item.quantity || 1,
      preco: parseFloat(item.subtotal || item.unit_price || 0) * (item.quantity || 1),
    };
  } else {
    // Fallback para item sem dados completos
    return {
      id: item.id?.toString() || `item-${Date.now()}`,
      massa: {
        id: 'unknown',
        type: 'massa' as const,
        name: 'Item desconhecido',
        price: 0,
        disponivel: true,
        description: '',
      },
      recheio: {
        id: 'unknown',
        type: 'recheio' as const,
        name: 'Item desconhecido',
        price: 0,
        disponivel: true,
        description: '',
      },
      cobertura: {
        id: 'unknown',
        type: 'cobertura' as const,
        name: 'Item desconhecido',
        price: 0,
        disponivel: true,
        description: '',
      },
      quantity: item.quantity || 1,
      preco: parseFloat(item.subtotal || item.unit_price || 0) * (item.quantity || 1),
    };
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

  // Mapear items do pedido
  const items: Cupcake[] = [];
  if (backendOrder.items && Array.isArray(backendOrder.items)) {
    try {
      items.push(...backendOrder.items.map(mapOrderItemToCupcake));
    } catch (error) {
      console.error('Erro ao mapear items do pedido:', error);
      // Continuar com items vazio se houver erro
    }
  }

  return {
    id: idStr,
    number: backendOrder.number
      ? backendOrder.number
      : `#CKP${idStr.padStart(10, '0')}`,
    status: mapBackendStatusToFrontend(backendOrder.status),
    total: parseFloat(backendOrder.total),
    destination: `${backendOrder.delivery_street}, ${backendOrder.delivery_number} - ${backendOrder.delivery_city}/${backendOrder.delivery_state}`,
    items,
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
  getAll: async (includeUnavailable: boolean = false) => {
    const url = includeUnavailable 
      ? '/products/cupcake-components/'
      : '/products/cupcake-components/?is_available=true';
    const response = await api.get<{ results: any[] }>(url);
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

  updateAvailability: async (id: string, isAvailable: boolean) => {
    const response = await api.patch(`/products/cupcake-components/${id}/`, {
      is_available: isAvailable,
    });
    return response.data;
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
