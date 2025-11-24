import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { OrderCard } from '../components/Order/OrderCard';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { HiPlus } from 'react-icons/hi';

export const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, loadOrders } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
    setLoading(false);
  }, [user, loadOrders]);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') return order.status !== 'pago';
    if (filter === 'completed') return order.status === 'pago';
    return true;
  });

  if (loading) {
    return (
      <Layout title="Meus Pedidos">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cake-pink mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Meus Pedidos">
      <div className="space-y-4 py-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-cake-pink text-cake-text'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'active'
                ? 'bg-cake-pink text-cake-text'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Em Andamento ({orders.filter((o) => o.status !== 'pago').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'completed'
                ? 'bg-cake-pink text-cake-text'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Concluídos ({orders.filter((o) => o.status === 'pago').length})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-cake-text mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Você ainda não fez nenhum pedido'
                : `Nenhum pedido ${filter === 'active' ? 'em andamento' : 'concluído'}`}
            </p>
            <button
              onClick={() => navigate('/montar')}
              className="px-6 py-3 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-semibold rounded-lg transition-colors"
            >
              Fazer Primeiro Pedido
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Add New Order Button */}
        <button
          onClick={() => navigate('/montar')}
          className="w-full bg-white hover:bg-gray-50 text-cake-text font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 shadow-lg"
        >
          <HiPlus size={24} className="text-cake-pink" />
          Fazer Novo Pedido
        </button>
      </div>
    </Layout>
  );
};

