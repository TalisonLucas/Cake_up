import type { Order, Cupcake, OrderStatusHistory, DeliveryCode, Address } from '../types';
import { massas, recheios, coberturas } from './components';
import { clients, operators } from './users';

// ============ HELPER TO CREATE CUPCAKES ============
const createCupcake = (
  massaId: string,
  recheioId: string,
  coberturaId: string,
  quantity: number = 1,
  observacoes?: string
): Cupcake => {
  const massa = massas.find(m => m.id === massaId)!;
  const recheio = recheios.find(r => r.id === recheioId)!;
  const cobertura = coberturas.find(c => c.id === coberturaId)!;
  
  return {
    id: `cup-${Date.now()}-${Math.random()}`,
    massa,
    recheio,
    cobertura,
    quantity,
    preco: massa.price + recheio.price + cobertura.price,
    observacoes,
  };
};

// ============ SAMPLE ADDRESSES ============
const addresses: Address[] = [
  {
    id: 'addr1',
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  {
    id: 'addr2',
    cep: '22041-001',
    street: 'Avenida Atlântica',
    number: '1702',
    district: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  {
    id: 'addr3',
    cep: '30130-000',
    street: 'Avenida Afonso Pena',
    number: '867',
    district: 'Centro',
    city: 'Belo Horizonte',
    state: 'MG',
  },
];

// ============ GENERATE DELIVERY CODE ============
const generateDeliveryCode = (createdAt: string): DeliveryCode => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const generatedDate = new Date(createdAt);
  const expiresDate = new Date(generatedDate.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    code,
    generatedAt: createdAt,
    expiresAt: expiresDate.toISOString(),
    attempts: 0,
    validated: false,
  };
};

// ============ MOCK ORDERS ============
export const mockOrders: Order[] = [
  // Pedido 1 - Aguardando
  {
    id: 'ord1',
    number: '#CKP2024001001',
    status: 'aguardando',
    total: 31.50,
    destination: 'São Paulo, SP',
    items: [
      createCupcake('m1', 'r1', 'c1', 2),
      createCupcake('m2', 'r2', 'c2', 1),
    ],
    canEditUntil: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // 1 minuto restante
    createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    clientId: clients[0].id,
    clientName: clients[0].name,
    enderecoEntrega: addresses[0],
    statusHistory: [
      {
        status: 'aguardando',
        timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        note: 'Pedido criado',
      },
    ],
  },
  // Pedido 2 - Aceito
  {
    id: 'ord2',
    number: '#CKP2024001002',
    status: 'aceito',
    total: 28.00,
    destination: 'São Paulo, SP',
    items: [
      createCupcake('m3', 'r3', 'c1', 2),
    ],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    clientId: clients[1].id,
    clientName: clients[1].name,
    operatorId: operators[0].id,
    operatorName: operators[0].name,
    enderecoEntrega: addresses[0],
    statusHistory: [
      {
        status: 'aguardando',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        note: 'Pedido criado',
      },
      {
        status: 'aceito',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        operatorId: operators[0].id,
        operatorName: operators[0].name,
        note: 'Pedido aceito',
      },
    ],
  },
  // Pedido 3 - Em Produção
  {
    id: 'ord3',
    number: '#CKP2024001003',
    status: 'producao',
    total: 35.50,
    destination: 'Rio de Janeiro, RJ',
    items: [
      createCupcake('m1', 'r1', 'c3', 3),
    ],
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    clientId: clients[2].id,
    clientName: clients[2].name,
    operatorId: operators[1].id,
    operatorName: operators[1].name,
    enderecoEntrega: addresses[1],
    statusHistory: [
      {
        status: 'aguardando',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        note: 'Pedido criado',
      },
      {
        status: 'aceito',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        operatorId: operators[1].id,
        operatorName: operators[1].name,
        note: 'Pedido aceito',
      },
      {
        status: 'producao',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        operatorId: operators[1].id,
        operatorName: operators[1].name,
        note: 'Iniciada a produção',
      },
    ],
  },
  // Pedido 4 - Liberado (com código)
  {
    id: 'ord4',
    number: '#CKP2024001004',
    status: 'liberado',
    total: 42.00,
    destination: 'São Paulo, SP',
    items: [
      createCupcake('m2', 'r2', 'c2', 4),
    ],
    deliveryCode: generateDeliveryCode(new Date(Date.now() - 30 * 60 * 1000).toISOString()),
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    clientId: clients[3].id,
    clientName: clients[3].name,
    operatorId: operators[2].id,
    operatorName: operators[2].name,
    enderecoEntrega: addresses[0],
    statusHistory: [
      {
        status: 'aguardando',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        note: 'Pedido criado',
      },
      {
        status: 'aceito',
        timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
        operatorId: operators[2].id,
        operatorName: operators[2].name,
        note: 'Pedido aceito',
      },
      {
        status: 'producao',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        operatorId: operators[2].id,
        operatorName: operators[2].name,
        note: 'Iniciada a produção',
      },
      {
        status: 'liberado',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        operatorId: operators[2].id,
        operatorName: operators[2].name,
        note: 'Liberado para entrega',
      },
    ],
  },
  // Pedido 5 - Pago (finalizado)
  {
    id: 'ord5',
    number: '#CKP2024001005',
    status: 'pago',
    total: 38.25,
    destination: 'Belo Horizonte, MG',
    items: [
      createCupcake('m1', 'r3', 'c1', 2),
      createCupcake('m3', 'r1', 'c3', 1),
    ],
    deliveryCode: {
      code: '847293',
      generatedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      attempts: 1,
      validated: true,
      validatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    clientId: clients[4].id,
    clientName: clients[4].name,
    operatorId: operators[0].id,
    operatorName: operators[0].name,
    enderecoEntrega: addresses[2],
    statusHistory: [
      {
        status: 'aguardando',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        note: 'Pedido criado',
      },
      {
        status: 'aceito',
        timestamp: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
        operatorId: operators[0].id,
        operatorName: operators[0].name,
        note: 'Pedido aceito',
      },
      {
        status: 'producao',
        timestamp: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
        operatorId: operators[0].id,
        operatorName: operators[0].name,
        note: 'Iniciada a produção',
      },
      {
        status: 'liberado',
        timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
        operatorId: operators[0].id,
        operatorName: operators[0].name,
        note: 'Liberado para entrega',
      },
      {
        status: 'pago',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        operatorId: operators[0].id,
        operatorName: operators[0].name,
        note: 'Pagamento confirmado',
      },
    ],
  },
];

// Generate more orders (total ~25)
for (let i = 6; i <= 25; i++) {
  const randomStatus: Array<'aguardando' | 'aceito' | 'producao' | 'liberado' | 'pago'> = 
    ['aguardando', 'aceito', 'producao', 'liberado', 'pago'];
  const status = randomStatus[Math.floor(Math.random() * randomStatus.length)];
  const client = clients[Math.floor(Math.random() * clients.length)];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const address = addresses[Math.floor(Math.random() * addresses.length)];
  
  const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const order: Order = {
    id: `ord${i}`,
    number: `#CKP2024${String(i).padStart(6, '0')}`,
    status,
    total: 20 + Math.random() * 80,
    destination: `${address.city}, ${address.state}`,
    items: [
      createCupcake(
        massas[Math.floor(Math.random() * massas.length)].id,
        recheios[Math.floor(Math.random() * recheios.length)].id,
        coberturas[Math.floor(Math.random() * coberturas.length)].id,
        Math.floor(1 + Math.random() * 4)
      ),
    ],
    createdAt,
    updatedAt: createdAt,
    clientId: client.id,
    clientName: client.name,
    operatorId: status !== 'aguardando' ? operator.id : undefined,
    operatorName: status !== 'aguardando' ? operator.name : undefined,
    enderecoEntrega: address,
    deliveryCode: (status === 'liberado' || status === 'pago') ? generateDeliveryCode(createdAt) : undefined,
    statusHistory: [
      {
        status: 'aguardando',
        timestamp: createdAt,
        note: 'Pedido criado',
      },
    ],
  };
  
  mockOrders.push(order);
}

// ============ HELPER FUNCTIONS ============
export const getOrderById = (id: string): Order | undefined => {
  return mockOrders.find(o => o.id === id);
};

export const getOrdersByStatus = (status: Order['status']): Order[] => {
  return mockOrders.filter(o => o.status === status);
};

export const getOrdersByClient = (clientId: string): Order[] => {
  return mockOrders.filter(o => o.clientId === clientId);
};

export const getOrdersByOperator = (operatorId: string): Order[] => {
  return mockOrders.filter(o => o.operatorId === operatorId);
};

