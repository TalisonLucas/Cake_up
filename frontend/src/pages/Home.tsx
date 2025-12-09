import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useAuthStore } from '../store/authStore';

export const Home = () => {
  const { user } = useAuthStore();

  const allMenuItems = [
    {
      title: 'Monte seu Cupcake',
      path: '/montar',
      color: 'bg-cake-cyan',
      icon: '🧁',
      description: 'Personalize seu cupcake perfeito',
    },
    {
      title: 'Meus Pedidos',
      path: '/meus-pedidos',
      color: 'bg-cake-cyan',
      icon: '📋',
      description: 'Acompanhe seus pedidos',
    },
    {
      title: 'História',
      path: '/historia',
      color: 'bg-cake-cyan',
      icon: '📖',
      description: 'Conheça nossa história',
    },
    {
      title: 'Quem somos',
      path: '/quem-somos',
      color: 'bg-cake-cyan',
      icon: '🏪',
      description: 'Sobre a Cake Up',
    },
  ];

  // Filtrar menuItems e adicionar card Dashboard para operadores e admins
  const menuItems = useMemo(() => {
    let items = [...allMenuItems];
    
    // Remover "Meus Pedidos" para operadores e admins
    if (user?.role === 'operator' || user?.role === 'admin') {
      items = items.filter(item => item.path !== '/meus-pedidos');
      
      // Criar card Dashboard baseado no role
      const dashboardCard = user?.role === 'admin' 
        ? {
            title: 'Dashboard Admin',
            path: '/admin/dashboard',
            color: 'bg-cake-cyan',
            icon: '👑',
            description: 'Painel de controle administrativo',
          }
        : {
            title: 'Dashboard Operador',
            path: '/operador/dashboard',
            color: 'bg-cake-cyan',
            icon: '🎯',
            description: 'Gerenciar pedidos e operações',
          };
      
      // Reorganizar: Dashboard primeiro, depois História, Quem somos, e Monte seu Cupcake por último
      // Após filtrar, items tem: Monte seu Cupcake, História, Quem somos
      // Queremos: Dashboard, História, Quem somos, Monte seu Cupcake
      const monteCupcake = items.find(item => item.path === '/montar');
      const outros = items.filter(item => item.path !== '/montar');
      
      items = [dashboardCard, ...outros];
      if (monteCupcake) {
        items.push(monteCupcake);
      }
    }
    
    return items;
  }, [user]);

  return (
    <Layout title="Home">
      <div className="py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎂</div>
          <h1 className="text-3xl font-bold text-cake-text mb-2">
            Bem-vindo ao Cake Up!
          </h1>
          <p className="text-gray-600">
            Cupcakes deliciosos feitos sob encomenda
          </p>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${item.color} block rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 p-6`}
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h2 className="text-xl font-semibold text-cake-text mb-1">
                {item.title}
              </h2>
              <p className="text-sm text-gray-700">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

