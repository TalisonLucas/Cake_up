import axios from 'axios';
import type { User, Product, Order, Address } from '../types';

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
  login: async (email: string, password: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    const response = await api.post<{ user: User; token: string }>('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    return response.data;
  },

  me: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Products endpoints
export const productsApi = {
  getAll: async () => {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },
};

// Orders endpoints
export const ordersApi = {
  getAll: async () => {
    const response = await api.get<Order[]>('/orders');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  create: async (items: { productId: string; quantity: number }[], addressId: string) => {
    const response = await api.post<Order>('/orders', {
      items,
      addressId,
    });
    return response.data;
  },
};

// Address endpoints
export const addressApi = {
  getAll: async () => {
    const response = await api.get<Address[]>('/addresses');
    return response.data;
  },

  create: async (address: Omit<Address, 'id'>) => {
    const response = await api.post<Address>('/addresses', address);
    return response.data;
  },

  update: async (id: string, address: Partial<Address>) => {
    const response = await api.put<Address>(`/addresses/${id}`, address);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/addresses/${id}`);
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

export default api;

