import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useCartStore } from '../store/cartStore';
import { productsApi } from '../services/api';
import type { Product } from '../types';
import { HiMinus, HiPlus } from 'react-icons/hi';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { items, total, calculateTotal } = useCartStore();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [items, calculateTotal]);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
      // Initialize quantities
      const initialQuantities: { [key: string]: number } = {};
      data.forEach((product) => {
        const cartItem = items.find((item) => item.product.id === product.id);
        initialQuantities[product.id] = cartItem?.quantity || 0;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Mock data for testing without backend
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Bolo de Chocolate',
          description: 'Delicioso bolo de chocolate',
          price: 45.0,
        },
        {
          id: '2',
          name: 'Bolo de Morango',
          description: 'Bolo com morangos frescos',
          price: 50.0,
        },
        {
          id: '3',
          name: 'Bolo de Cenoura',
          description: 'Bolo de cenoura com cobertura',
          price: 40.0,
        },
      ];
      setProducts(mockProducts);
      const initialQuantities: { [key: string]: number } = {};
      mockProducts.forEach((product) => {
        initialQuantities[product.id] = 0;
      });
      setQuantities(initialQuantities);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const newQty = Math.max(0, (prev[productId] || 0) + delta);
      const product = products.find((p) => p.id === productId);
      if (product) {
        if (newQty === 0) {
          useCartStore.getState().removeItem(productId);
        } else {
          useCartStore.getState().updateQuantity(productId, newQty);
          if (!items.find((item) => item.product.id === productId)) {
            useCartStore.getState().addItem(product, newQty);
          }
        }
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleCalculateShipping = () => {
    alert('Funcionalidade de cálculo de frete em desenvolvimento!');
  };

  if (loading) {
    return (
      <Layout title="Produtos">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cake-pink mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando produtos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Produtos">
      <div className="space-y-4 py-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-lg p-4 flex gap-4"
          >
            {/* Product Image Placeholder */}
            <div className="w-24 h-24 bg-cake-cyan rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">🎂</span>
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-cake-text">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <p className="text-lg font-bold text-cake-text">
                R$ {product.price.toFixed(2)}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-medium">Qtd:</span>
                <div className="flex items-center gap-2 bg-cake-cyan rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(product.id, -1)}
                    className="p-2 hover:bg-cake-dark-pink rounded-l-lg transition-colors"
                    aria-label="Diminuir quantidade"
                  >
                    <HiMinus size={16} />
                  </button>
                  <span className="px-3 font-semibold min-w-[2rem] text-center">
                    {quantities[product.id] || 0}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(product.id, 1)}
                    className="p-2 hover:bg-cake-dark-pink rounded-r-lg transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <HiPlus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Footer with Total and Shipping */}
        <div className="bg-cake-cyan rounded-2xl shadow-lg p-4 space-y-3">
          <button
            onClick={handleCalculateShipping}
            className="w-full bg-white hover:bg-gray-50 text-cake-text font-semibold py-3 rounded-lg transition-colors border-2 border-dashed border-gray-300"
          >
            Calcular frete
          </button>
          <div className="flex justify-between items-center text-lg font-bold pt-3 border-t-2 border-white">
            <span>Total pedido:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

