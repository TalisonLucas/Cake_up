import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductsChartProps {
  topProducts: Array<{
    product__name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  customCupcakesSold: number;
}

const COLORS = ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export const ProductsChart = ({ topProducts, customCupcakesSold }: ProductsChartProps) => {
  // Preparar dados para gráfico de barras
  const barData = topProducts.map(product => ({
    nome: product.product__name || 'Produto',
    quantidade: product.quantity_sold,
    receita: parseFloat(product.revenue.toString()),
  }));

  // Preparar dados para gráfico de pizza (produtos vs cupcakes personalizados)
  const pieData = [
    { name: 'Cupcakes Personalizados', value: customCupcakesSold },
    { name: 'Produtos Prontos', value: topProducts.reduce((sum, p) => sum + p.quantity_sold, 0) },
  ];

  return (
    <div className="space-y-6">
      {/* Gráfico de Barras Melhorado */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Top 10 Produtos Mais Vendidos</h3>
          <p className="text-sm text-gray-600">Quantidade vendida por produto</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis dataKey="nome" type="category" width={150} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="quantidade" fill="#ec4899" name="Quantidade Vendida" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Pizza Melhorado */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Distribuição de Vendas</h3>
          <p className="text-sm text-gray-600">Comparação entre produtos prontos e personalizados</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

