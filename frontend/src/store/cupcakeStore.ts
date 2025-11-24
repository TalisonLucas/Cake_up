import { create } from 'zustand';
import type { Cupcake, CupcakeComponent } from '../types';
import { calculateCupcakePrice } from '../mocks/components';

interface CupcakeBuilderState {
  // Current cupcake being built
  selectedMassa: CupcakeComponent | null;
  selectedRecheio: CupcakeComponent | null;
  selectedCobertura: CupcakeComponent | null;
  quantity: number;
  observacoes: string;
  
  // Cart of completed cupcakes
  cart: Cupcake[];
  
  // Actions
  setMassa: (massa: CupcakeComponent) => void;
  setRecheio: (recheio: CupcakeComponent) => void;
  setCobertura: (cobertura: CupcakeComponent) => void;
  setQuantity: (quantity: number) => void;
  setObservacoes: (obs: string) => void;
  
  // Cart actions
  addToCart: () => boolean;
  removeFromCart: (index: number) => void;
  updateCartItem: (index: number, cupcake: Cupcake) => void;
  clearCart: () => void;
  getTotal: () => number;
  
  // Reset builder
  resetBuilder: () => void;
}

export const useCupcakeStore = create<CupcakeBuilderState>((set, get) => ({
  // Initial state
  selectedMassa: null,
  selectedRecheio: null,
  selectedCobertura: null,
  quantity: 1,
  observacoes: '',
  cart: [],
  
  // Setters
  setMassa: (massa) => set({ selectedMassa: massa }),
  setRecheio: (recheio) => set({ selectedRecheio: recheio }),
  setCobertura: (cobertura) => set({ selectedCobertura: cobertura }),
  setQuantity: (quantity) => set({ quantity: Math.max(1, quantity) }),
  setObservacoes: (obs) => set({ observacoes: obs }),
  
  // Add to cart
  addToCart: () => {
    const state = get();
    const { selectedMassa, selectedRecheio, selectedCobertura, quantity, observacoes } = state;
    
    // Validate selection
    if (!selectedMassa || !selectedRecheio || !selectedCobertura) {
      return false;
    }
    
    // Create cupcake
    const cupcake: Cupcake = {
      id: `cup-${Date.now()}-${Math.random()}`,
      massa: selectedMassa,
      recheio: selectedRecheio,
      cobertura: selectedCobertura,
      quantity,
      preco: calculateCupcakePrice(selectedMassa.id, selectedRecheio.id, selectedCobertura.id),
      observacoes: observacoes || undefined,
    };
    
    // Add to cart
    set((state) => ({
      cart: [...state.cart, cupcake],
    }));
    
    // Reset builder
    get().resetBuilder();
    
    return true;
  },
  
  // Remove from cart
  removeFromCart: (index) => {
    set((state) => ({
      cart: state.cart.filter((_, i) => i !== index),
    }));
  },
  
  // Update cart item
  updateCartItem: (index, cupcake) => {
    set((state) => ({
      cart: state.cart.map((item, i) => (i === index ? cupcake : item)),
    }));
  },
  
  // Clear cart
  clearCart: () => {
    set({ cart: [] });
  },
  
  // Get total price
  getTotal: () => {
    const { cart } = get();
    return cart.reduce((total, cupcake) => total + cupcake.preco * cupcake.quantity, 0);
  },
  
  // Reset builder
  resetBuilder: () => {
    set({
      selectedMassa: null,
      selectedRecheio: null,
      selectedCobertura: null,
      quantity: 1,
      observacoes: '',
    });
  },
}));


