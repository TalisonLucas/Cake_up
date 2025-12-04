import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HiUsers, HiShoppingBag, HiTrendingUp } from 'react-icons/hi';

interface Customer {
  id: number;
  name: string;
  username: string;
  order_count: number;
  total_spent: number;
}

interface CustomersChartProps {
  topCustomers: Customer[];
  totalCustomers: number;
  customersWithOrders: number;
}

export const CustomersChart = ({ topCustomers, totalCustomers, customersWithOrders }: CustomersChartProps) => {
  const chartData = topCustomers.map(customer => ({
    nome: customer.name || customer.username,
    pedidos: customer.order_count,
    gasto: parseFloat(customer.total_spent.toString()),
  }));

  const conversionRate = totalCustomers > 0 ? ((customersWithOrders / totalCustomers) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais Melhoradas */}
      <div className="grid grid-cols-1 desktop:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-md border border-blue-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
              <HiUsers className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-700">Total de Clientes</h4>
              <p className="text-3xl font-bold text-blue-900 mt-1">{totalCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-md border border-green-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-green-500 rounded-xl shadow-sm">
              <HiShoppingBag className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-700">Clientes com Pedidos</h4>
              <p className="text-3xl font-bold text-green-900 mt-1">{customersWithOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-md border border-purple-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
              <HiTrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-700">Taxa de Conversão</h4>
              <p className="text-3xl font-bold text-purple-900 mt-1">{conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras Melhorado */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Top 10 Clientes por Valor Gasto</h3>
          <p className="text-sm text-gray-600">Análise dos principais clientes do sistema</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="nome" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number, name: string) => 
                name === 'gasto' ? `R$ ${value.toFixed(2)}` : value
              }
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="pedidos" fill="#8b5cf6" name="Pedidos" radius={[8, 8, 0, 0]} />
            <Bar dataKey="gasto" fill="#ec4899" name="Total Gasto (R$)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

