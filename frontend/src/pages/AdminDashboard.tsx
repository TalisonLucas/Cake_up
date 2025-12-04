import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { StatsCard } from '../components/Operator/StatsCard';
import { OrderManagementCard } from '../components/Operator/OrderManagementCard';
import { ReportsTab } from '../components/Admin/ReportsTab';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { useWebSocketStore } from '../store/websocketStore';
import { reportsApi, ordersApi } from '../services/api';
import { type OrderStatus } from '../types';
import { 
  HiClock, 
  HiCheckCircle, 
  HiTruck, 
  HiCurrencyDollar,
  HiUsers,
  HiCog,
  HiShieldCheck,
  HiChartBar,
  HiShoppingBag,
  HiViewGrid,
  HiViewList
} from 'react-icons/hi';

export const AdminDashboard = () => {
  const { orders, loadOrders } = useOrderStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'aguardando' | 'aceito' | 'producao' | 'liberado' | 'pago' | 'cancelado'>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'stats' | 'users' | 'products'>('orders');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadData();
    
    // Conectar WebSocket para atualizações em tempo real
    const connectWebSocket = async () => {
      try {
        await useWebSocketStore.getState().connect();
      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    // Desconectar ao desmontar
    return () => {
      useWebSocketStore.getState().disconnect();
    };
  }, []);

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
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  const handleValidateCode = async (orderId: string, code: string) => {
    try {
      await ordersApi.validateDeliveryCode(orderId, code);
      alert('Código validado com sucesso! Pagamento confirmado.');
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao validar código';
      alert(errorMsg);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja cancelar este pedido? Essa ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await ordersApi.cancel(orderId);
      alert('Pedido cancelado com sucesso.');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao cancelar pedido:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Erro ao cancelar pedido';
      alert(errorMsg);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <Layout title="Dashboard Administrador">
        <div className="flex items-center justify-center py-12 min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium">Carregando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Administrador">
      <div className="space-y-6 py-4 max-w-7xl mx-auto">
        {/* Header de Boas-vindas Melhorado */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 desktop:p-8 shadow-xl">
          <div className="flex flex-col desktop:flex-row items-start desktop:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <HiShieldCheck size={32} className="opacity-90" />
                <h2 className="text-2xl desktop:text-3xl font-bold">Olá, {user?.name || 'Administrador'}! 👑</h2>
              </div>
              <p className="text-purple-100 text-sm desktop:text-base">Painel de controle administrativo completo</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs text-purple-100">Total de Pedidos</p>
                  <p className="text-xl font-bold">{orders.length}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs text-purple-100">Receita Hoje</p>
                  <p className="text-xl font-bold">R$ {(stats?.revenue_today || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="hidden desktop:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                <HiShieldCheck size={48} className="opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegação Melhoradas */}
        <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <HiShoppingBag size={20} />
              <span>Pedidos</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <HiChartBar size={20} />
              <span>Relatórios</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <HiUsers size={20} />
              <span>Usuários</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <HiCog size={20} />
              <span>Produtos</span>
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Estatísticas Rápidas Melhoradas */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <HiChartBar className="text-purple-600" size={24} />
                Estatísticas de Hoje
              </h2>
              <div className="grid grid-cols-2 desktop:grid-cols-4 gap-4">
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

            {/* Filtros de Pedidos Melhorados */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiShoppingBag className="text-purple-600" size={24} />
                  Gerenciar Pedidos
                </h2>
                {/* Toggle Grid/List */}
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Visualização em Grid"
                  >
                    <HiViewGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Visualização em Lista"
                  >
                    <HiViewList size={20} />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'all'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Todos ({orders.length})
                  </button>
                  <button
                    onClick={() => setFilter('aguardando')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'aguardando'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Aguardando ({orders.filter(o => o.status === 'aguardando').length})
                  </button>
                  <button
                    onClick={() => setFilter('aceito')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'aceito'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Aceito ({orders.filter(o => o.status === 'aceito').length})
                  </button>
                  <button
                    onClick={() => setFilter('producao')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'producao'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Em Produção ({orders.filter(o => o.status === 'producao').length})
                  </button>
                  <button
                    onClick={() => setFilter('liberado')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'liberado'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Liberado ({orders.filter(o => o.status === 'liberado').length})
                  </button>
                  <button
                    onClick={() => setFilter('pago')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'pago'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Pago ({orders.filter(o => o.status === 'pago').length})
                  </button>
                  <button
                    onClick={() => setFilter('cancelado')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                      filter === 'cancelado'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Cancelado ({orders.filter(o => o.status === 'cancelado').length})
                  </button>
                </div>
              </div>

              {/* Lista de Pedidos */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
                  <div className="text-7xl mb-6">📦</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Nenhum pedido {filter !== 'all' ? filter : 'encontrado'}
                  </h3>
                  <p className="text-gray-500 text-lg">
                    Todos os pedidos estão em dia!
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-3 2xl:grid-cols-4 gap-4">
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
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <OrderManagementCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      onValidateCode={handleValidateCode}
                      onCancel={handleCancelOrder}
                      compact={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <ReportsTab />
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex flex-col desktop:flex-row justify-between items-start desktop:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <HiUsers className="text-purple-600" size={28} />
                  Gerenciamento de Usuários
                </h2>
                <p className="text-gray-600 mt-1">Gerencie usuários, permissões e acessos</p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold shadow-md transition-all duration-200 flex items-center gap-2">
                <span>+</span>
                <span>Novo Usuário</span>
              </button>
            </div>
            <div className="text-center py-16">
              <div className="bg-purple-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <HiUsers size={48} className="text-purple-400" />
              </div>
              <p className="text-gray-600 text-lg mb-2">Funcionalidade em desenvolvimento</p>
              <p className="text-sm text-gray-500">
                Use o Django Admin para gerenciar usuários: 
                <a 
                  href="http://localhost:8000/admin/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-purple-600 underline hover:text-purple-700 ml-1"
                >
                  http://localhost:8000/admin/
                </a>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex flex-col desktop:flex-row justify-between items-start desktop:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <HiCog className="text-purple-600" size={28} />
                  Gerenciamento de Produtos
                </h2>
                <p className="text-gray-600 mt-1">Gerencie produtos, estoque e componentes</p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold shadow-md transition-all duration-200 flex items-center gap-2">
                <span>+</span>
                <span>Novo Produto</span>
              </button>
            </div>
            <div className="text-center py-16">
              <div className="bg-purple-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <HiCog size={48} className="text-purple-400" />
              </div>
              <p className="text-gray-600 text-lg mb-2">Funcionalidade em desenvolvimento</p>
              <p className="text-sm text-gray-500">
                Use o Django Admin para gerenciar produtos: 
                <a 
                  href="http://localhost:8000/admin/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-purple-600 underline hover:text-purple-700 ml-1"
                >
                  http://localhost:8000/admin/
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

