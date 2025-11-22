import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';

export const Home = () => {
  const menuItems = [
    {
      title: 'Produtos',
      path: '/produtos',
      color: 'bg-cake-cyan',
    },
    {
      title: 'História',
      path: '/historia',
      color: 'bg-cake-cyan',
    },
    {
      title: 'Quem somos',
      path: '/quem-somos',
      color: 'bg-cake-cyan',
    },
  ];

  return (
    <Layout title="Home">
      <div className="space-y-6 py-8">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${item.color} block rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 text-center`}
          >
            <h2 className="text-2xl font-semibold text-cake-text">{item.title}</h2>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

