import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { StatsCard } from '../components/Operator/StatsCard';
import { OrderManagementCard } from '../components/Operator/OrderManagementCard';
import { IngredientsManagementTab } from '../components/Admin/IngredientsManagementTab';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { useWebSocketStore } from '../store/websocketStore';
import { useChatStore } from '../store/chatStore';
import { reportsApi, ordersApi } from '../services/api';
import { type OrderStatus } from '../types';
import { HiClock, HiCheckCircle, HiTruck, HiCurrencyDollar, HiCog } from 'react-icons/hi';

export const OperatorDashboard = () => {
  const { orders, loadOrders } = useOrderStore();
  const { user } = useAuthStore();
  const { loadConversations } = useChatStore();
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'aguardando' | 'aceito' | 'producao' | 'liberado' | 'pago' | 'cancelado'>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'ingredients'>('orders');

  // Log para debug quando orders mudar
  useEffect(() => {
    console.log('📊 OperatorDashboard: orders atualizado', {
      total: orders.length,
      porStatus: {
        aguardando: orders.filter(o => o.status === 'aguardando').length,
        aceito: orders.filter(o => o.status === 'aceito').length,
        producao: orders.filter(o => o.status === 'producao').length,
        liberado: orders.filter(o => o.status === 'liberado').length,
        pago: orders.filter(o => o.status === 'pago').length,
        cancelado: orders.filter(o => o.status === 'cancelado').length,
      },
      filtroAtual: filter,
    });
  }, [orders, filter]);

  useEffect(() => {
    loadData();
    // Carregar conversas para exibir badges de notificação
    loadConversations();

    // Conectar WebSocket para atualizações em tempo real
    const connectWebSocket = async () => {
      try {
        await useWebSocketStore.getState().connect();
      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
      }
    };

    connectWebSocket();

    // Atualizar conversas periodicamente para manter badges atualizados (a cada 30 segundos)
    const conversationInterval = setInterval(() => {
      loadConversations();
    }, 30000);

    // Atualizar conversas quando a janela receber foco (usuário volta para a aba)
    const handleFocus = () => {
      loadConversations();
    };
    window.addEventListener('focus', handleFocus);

    // Desconectar ao desmontar apenas se realmente conectou
    return () => {
      clearInterval(conversationInterval);
      window.removeEventListener('focus', handleFocus);
      const { connected } = useWebSocketStore.getState();
      if (connected) {
        useWebSocketStore.getState().disconnect();
      }
    };
  }, [loadConversations]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadOrders();
      const dashboardStats = await reportsApi.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      // Não recarregar dados - o WebSocket vai atualizar automaticamente em tempo real
      // Feedback visual será mostrado quando o WebSocket atualizar o pedido
      console.log(`✅ Status do pedido ${orderId} atualizado para ${newStatus}. Aguardando atualização via WebSocket...`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  const handleValidateCode = async (orderId: string, code: string) => {
    try {
      await ordersApi.validateDeliveryCode(orderId, code);
      alert('Código validado com sucesso! Pagamento confirmado.');
      // Não recarregar dados - o WebSocket vai atualizar automaticamente em tempo real
      console.log(`✅ Código validado para pedido ${orderId}. Aguardando atualização via WebSocket...`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao validar código';
      alert(errorMsg);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja recusar este pedido? Essa ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await ordersApi.cancel(orderId);
      alert('Pedido recusado com sucesso.');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao recusar pedido:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Erro ao recusar pedido';
      alert(errorMsg);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <Layout title="Dashboard Operador">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cake-pink mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Operador">
      <div className="space-y-6 py-4">
        {/* Bem-vindo */}
        <div className="bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Olá, {user?.name || 'Operador'}! 👋</h2>
          <p className="text-sm opacity-90">Bem-vindo ao painel de controle. Aqui você gerencia todos os pedidos.</p>
        </div>

        {/* Estatísticas */}
        <div>
          <h2 className="text-xl font-bold text-cake-text mb-4">Estatísticas de Hoje</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Pedidos Hoje"
              value={stats?.orders_today || 0}
              icon={<HiClock size={24} />}
              color="blue"
            />
            <StatsCard
              title="Aguardando"
              value={stats?.orders_awaiting || 0}
              icon={<HiCheckCircle size={24} />}
              color="orange"
            />
            <StatsCard
              title="Em Produção"
              value={stats?.orders_in_production || 0}
              icon={<HiTruck size={24} />}
              color="purple"
            />
            <StatsCard
              title="Receita Hoje"
              value={`R$ ${(stats?.revenue_today || 0).toFixed(2)}`}
              icon={<HiCurrencyDollar size={24} />}
              color="green"
            />
          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${activeTab === 'orders'
                  ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <HiTruck size={20} />
              <span>Pedidos</span>
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${activeTab === 'ingredients'
                  ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <HiCog size={20} />
              <span>Ingredientes</span>
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div>
          {activeTab === 'orders' && (
            <div>
              {/* Filtros de Pedidos */}
              <div>
                <h2 className="text-xl font-bold text-cake-text mb-4">Gerenciar Pedidos</h2>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'all'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Todos ({orders.length})
                    </button>
                    <button
                      onClick={() => setFilter('aguardando')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'aguardando'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Aguardando ({orders.filter(o => o.status === 'aguardando').length})
                    </button>
                    <button
                      onClick={() => setFilter('aceito')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'aceito'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Aceito ({orders.filter(o => o.status === 'aceito').length})
                    </button>
                    <button
                      onClick={() => setFilter('producao')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'producao'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Em Produção ({orders.filter(o => o.status === 'producao').length})
                    </button>
                    <button
                      onClick={() => setFilter('liberado')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'liberado'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Liberado ({orders.filter(o => o.status === 'liberado').length})
                    </button>
                    <button
                      onClick={() => setFilter('pago')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'pago'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Pago ({orders.filter(o => o.status === 'pago').length})
                    </button>
                    <button
                      onClick={() => setFilter('cancelado')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${filter === 'cancelado'
                          ? 'bg-gradient-to-r from-cake-pink to-cake-dark-pink text-cake-text shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      Cancelado ({orders.filter(o => o.status === 'cancelado').length})
                    </button>
                  </div>
                </div>

                {/* Lista de Pedidos */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-cake-text mb-2">
                      Nenhum pedido {filter !== 'all' ? filter : 'encontrado'}
                    </h3>
                    <p className="text-gray-600">
                      Todos os pedidos estão em dia!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                      <OrderManagementCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onValidateCode={handleValidateCode}
                        onCancel={handleCancelOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'ingredients' && (
            <IngredientsManagementTab />
          )}
        </div>
      </div>
    </Layout>
  );
};
