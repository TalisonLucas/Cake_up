import type { CupcakeComponent } from '../types';

// ============ MASSAS ============
export const massas: CupcakeComponent[] = [
  {
    id: 'm1',
    type: 'massa',
    name: 'Chocolate',
    price: 5.00,
    disponivel: true,
    description: 'Massa aerada de chocolate belga',
    estoque: 50,
  },
  {
    id: 'm2',
    type: 'massa',
    name: 'Baunilha',
    price: 4.50,
    disponivel: true,
    description: 'Massa clássica de baunilha',
    estoque: 60,
  },
  {
    id: 'm3',
    type: 'massa',
    name: 'Misto',
    price: 4.75,
    disponivel: true,
    description: 'Combinação de chocolate e baunilha',
    estoque: 45,
  },
];

// ============ RECHEIOS ============
export const recheios: CupcakeComponent[] = [
  {
    id: 'r1',
    type: 'recheio',
    name: 'Creme de Avelã',
    price: 3.00,
    disponivel: true,
    description: 'Cremoso recheio de avelã',
    estoque: 30,
  },
  {
    id: 'r2',
    type: 'recheio',
    name: 'Leite em Pó',
    price: 2.50,
    disponivel: true,
    description: 'Doce de leite em pó artesanal',
    estoque: 40,
  },
  {
    id: 'r3',
    type: 'recheio',
    name: 'Compota de Frutas Vermelhas',
    price: 3.50,
    disponivel: true,
    description: 'Compota caseira de frutas vermelhas',
    estoque: 25,
  },
];

// ============ COBERTURAS ============
export const coberturas: CupcakeComponent[] = [
  {
    id: 'c1',
    type: 'cobertura',
    name: 'Chantili Chocolate',
    price: 2.00,
    disponivel: true,
    description: 'Chantili cremoso de chocolate',
    estoque: 50,
  },
  {
    id: 'c2',
    type: 'cobertura',
    name: 'Chantili Baunilha',
    price: 2.00,
    disponivel: true,
    description: 'Chantili clássico de baunilha',
    estoque: 55,
  },
  {
    id: 'c3',
    type: 'cobertura',
    name: 'Chantili Groselha',
    price: 2.50,
    disponivel: true,
    description: 'Chantili especial de groselha',
    estoque: 30,
  },
];

// ============ HELPER FUNCTIONS ============
export const getComponentsByType = (type: 'massa' | 'recheio' | 'cobertura'): CupcakeComponent[] => {
  switch (type) {
    case 'massa':
      return massas;
    case 'recheio':
      return recheios;
    case 'cobertura':
      return coberturas;
    default:
      return [];
  }
};

export const getComponentById = (id: string): CupcakeComponent | undefined => {
  const allComponents = [...massas, ...recheios, ...coberturas];
  return allComponents.find(c => c.id === id);
};

export const calculateCupcakePrice = (
  massaId: string,
  recheioId: string,
  coberturaId: string
): number => {
  const massa = getComponentById(massaId);
  const recheio = getComponentById(recheioId);
  const cobertura = getComponentById(coberturaId);
  
  if (!massa || !recheio || !cobertura) return 0;
  
  return massa.price + recheio.price + cobertura.price;
};




