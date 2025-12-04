import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SalesChartProps {
  data: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export const SalesChart = ({ data }: SalesChartProps) => {
  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    pedidos: item.orders,
    receita: parseFloat(item.revenue.toString()),
  })).reverse(); // Reverter para mostrar do mais antigo ao mais recente

  return (
    <div className="space-y-6">
      {/* Gráfico de Linha Melhorado */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Pedidos por Dia</h3>
          <p className="text-sm text-gray-600">Evolução do número de pedidos ao longo do período</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="pedidos" 
              stroke="#ec4899" 
              strokeWidth={3}
              dot={{ fill: '#ec4899', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras Melhorado */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Receita por Dia</h3>
          <p className="text-sm text-gray-600">Valor total arrecadado por dia</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="receita" fill="#8b5cf6" name="Receita (R$)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

