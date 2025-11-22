export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
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

export interface Order {
  id: string;
  number: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  destination: string;
  items: CartItem[];
  createdAt: string;
}

