import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useOrderStore } from '../store/orderStore';
import { ordersApi } from '../services/api';
import { HiPlus } from 'react-icons/hi';

export const Orders = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      // Mock data for testing without backend
      setOrders([
        {
          id: '1',
          number: '001',
          status: 'processing',
          total: 95.0,
          destination: 'São Paulo, SP',
          items: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          number: '002',
          status: 'completed',
          total: 45.0,
          destination: 'Rio de Janeiro, RJ',
          items: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendente',
      processing: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleAddItemToOrder = () => {
    navigate('/produtos');
  };

  if (loading) {
    return (
      <Layout title="Pedidos">
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
    <Layout title="Pedidos">
      <div className="space-y-4 py-4">
        {/* Orders Table */}
        <div className="bg-cake-cyan rounded-2xl shadow-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-white">
                  <th className="text-left py-3 px-2 text-sm font-semibold">Nº pedido</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold">Valor</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold">Destino</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-600">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-white last:border-0">
                      <td className="py-3 px-2 text-sm">{order.number}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm font-semibold">
                        R$ {order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-sm">{order.destination}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add to Open Order Button */}
        <button
          onClick={handleAddItemToOrder}
          className="w-full bg-white hover:bg-gray-50 text-cake-text font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 shadow-lg"
        >
          <HiPlus size={24} className="text-cake-pink" />
          Incluir item em pedido aberto
        </button>
      </div>
    </Layout>
  );
};

