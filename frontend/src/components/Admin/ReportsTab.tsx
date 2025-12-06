import { useState, useEffect } from 'react';
import { reportsApi } from '../../services/api';
import { SalesChart } from './SalesChart';
import { ProductsChart } from './ProductsChart';
import { CustomersChart } from './CustomersChart';
import { HiChartBar, HiTrendingUp, HiShoppingBag, HiUsers } from 'react-icons/hi';

export const ReportsTab = () => {
  const [activeReport, setActiveReport] = useState<'sales' | 'products' | 'customers'>('sales');
  const [period, setPeriod] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  
  // Dados dos relatórios
  const [salesData, setSalesData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [customersData, setCustomersData] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, [period, activeReport]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (activeReport === 'sales') {
        const data = await reportsApi.getSalesReport(period);
        setSalesData(data);
      } else if (activeReport === 'products') {
        const data = await reportsApi.getProductsReport();
        setProductsData(data);
      } else if (activeReport === 'customers') {
        const data = await reportsApi.getCustomersStats();
        setCustomersData(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar relatórios:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Erro ao carregar relatórios';
      console.error('Detalhes do erro:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });
      alert(`Erro ao carregar relatórios: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de Filtros Melhorado */}
      <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
        <div className="flex flex-col desktop:flex-row gap-4 items-start desktop:items-center justify-between">
          {/* Botões de Seleção de Relatório */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setActiveReport('sales')}
              className={`px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeReport === 'sales'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <HiTrendingUp size={20} />
              Vendas
            </button>
            <button
              onClick={() => setActiveReport('products')}
              className={`px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeReport === 'products'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <HiShoppingBag size={20} />
              Produtos
            </button>
            <button
              onClick={() => setActiveReport('customers')}
              className={`px-5 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeReport === 'customers'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <HiUsers size={20} />
              Clientes
            </button>
          </div>

          {/* Filtro de Período */}
          {activeReport === 'sales' && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-gray-700"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={15}>Últimos 15 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Loading Melhorado */}
      {loading && (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium">Carregando relatórios...</p>
          </div>
        </div>
      )}

      {/* Relatório de Vendas Melhorado */}
      {!loading && activeReport === 'sales' && salesData && (
        <div className="space-y-6">
          {/* Cards de Resumo Melhorados */}
          <div className="grid grid-cols-1 desktop:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-md border border-blue-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                  <HiShoppingBag className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-blue-900">{salesData.total_orders}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-md border border-green-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                  <HiTrendingUp className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 mb-1">Receita Total</p>
                  <p className="text-3xl font-bold text-green-900">
                    R$ {parseFloat(salesData.total_revenue.toString()).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 shadow-md border border-purple-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                  <HiChartBar className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700 mb-1">Ticket Médio</p>
                  <p className="text-3xl font-bold text-purple-900">
                    R$ {parseFloat(salesData.average_order_value?.toString() || '0').toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 shadow-md border border-orange-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-xl shadow-sm">
                  <HiTrendingUp className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-700 mb-1">Período</p>
                  <p className="text-3xl font-bold text-orange-900">{salesData.period_days} dias</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <SalesChart data={salesData.sales_by_day || []} />
        </div>
      )}

      {/* Relatório de Produtos Melhorado */}
      {!loading && activeReport === 'products' && productsData && (
        <div className="space-y-6">
          {/* Cards de Resumo Melhorados */}
          <div className="grid grid-cols-1 desktop:grid-cols-3 gap-5">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-md border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-2">Total de Produtos</p>
              <p className="text-4xl font-bold text-blue-900">{productsData.total_products || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 shadow-md border border-pink-200">
              <p className="text-sm font-medium text-pink-700 mb-2">Cupcakes Personalizados</p>
              <p className="text-4xl font-bold text-pink-900">{productsData.custom_cupcakes_sold || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 shadow-md border border-red-200">
              <p className="text-sm font-medium text-red-700 mb-2">Produtos Sem Estoque</p>
              <p className="text-4xl font-bold text-red-900">{productsData.products_out_of_stock || 0}</p>
            </div>
          </div>

          {/* Gráficos */}
          <ProductsChart 
            topProducts={productsData.top_products || []} 
            customCupcakesSold={productsData.custom_cupcakes_sold || 0}
          />
        </div>
      )}

      {/* Relatório de Clientes */}
      {!loading && activeReport === 'customers' && customersData && (
        <CustomersChart
          topCustomers={customersData.top_customers || []}
          totalCustomers={customersData.total_customers || 0}
          customersWithOrders={customersData.customers_with_orders || 0}
        />
      )}
    </div>
  );
};

