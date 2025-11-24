import type { User, Operator } from '../types';

// ============ ADMINISTRADORES ============
export const admins: User[] = [
  {
    id: 'adm1',
    name: 'Carlos Admin',
    email: 'carlos@cakeup.com',
    phone: '11987654321',
    role: 'admin',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'adm2',
    name: 'Ana Silva',
    email: 'ana@cakeup.com',
    phone: '11987654322',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'adm3',
    name: 'Roberto Santos',
    email: 'roberto@cakeup.com',
    phone: '11987654323',
    role: 'admin',
    createdAt: '2024-02-01T10:00:00Z',
  },
];

// ============ OPERADORES ============
export const operators: Operator[] = [
  {
    id: 'op1',
    name: 'Maria Silva',
    email: 'maria@cakeup.com',
    phone: '11987654324',
    role: 'operator',
    isActive: true,
    ordersHandled: 58,
    averageRating: 4.9,
    joinedAt: '2024-03-01T10:00:00Z',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'op2',
    name: 'João Santos',
    email: 'joao@cakeup.com',
    phone: '11987654325',
    role: 'operator',
    isActive: true,
    ordersHandled: 52,
    averageRating: 4.8,
    joinedAt: '2024-03-10T10:00:00Z',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'op3',
    name: 'Ana Costa',
    email: 'ana.costa@cakeup.com',
    phone: '11987654326',
    role: 'operator',
    isActive: true,
    ordersHandled: 32,
    averageRating: 4.7,
    joinedAt: '2024-04-01T10:00:00Z',
    createdAt: '2024-04-01T10:00:00Z',
  },
  {
    id: 'op4',
    name: 'Pedro Oliveira',
    email: 'pedro@cakeup.com',
    phone: '11987654327',
    role: 'operator',
    isActive: true,
    ordersHandled: 45,
    averageRating: 4.6,
    joinedAt: '2024-04-15T10:00:00Z',
    createdAt: '2024-04-15T10:00:00Z',
  },
  {
    id: 'op5',
    name: 'Lucia Ferreira',
    email: 'lucia@cakeup.com',
    phone: '11987654328',
    role: 'operator',
    isActive: false,
    ordersHandled: 28,
    averageRating: 4.5,
    joinedAt: '2024-05-01T10:00:00Z',
    createdAt: '2024-05-01T10:00:00Z',
  },
];

// ============ CLIENTES ============
export const clients: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `cli${i + 1}`,
  name: `Cliente ${i + 1}`,
  email: `cliente${i + 1}@email.com`,
  phone: `119${String(i + 1).padStart(8, '0')}`,
  role: 'client' as const,
  createdAt: new Date(2024, 0, 1 + i).toISOString(),
}));

// ============ HELPER FUNCTIONS ============
export const getUserById = (id: string): User | Operator | undefined => {
  const allUsers = [...admins, ...operators, ...clients];
  return allUsers.find(u => u.id === id);
};

export const getUsersByRole = (role: 'client' | 'operator' | 'admin'): User[] => {
  const allUsers = [...admins, ...operators, ...clients];
  return allUsers.filter(u => u.role === role);
};

export const getActiveOperators = (): Operator[] => {
  return operators.filter(op => op.isActive);
};

