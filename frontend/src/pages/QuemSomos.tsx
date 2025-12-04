import { Layout } from '../components/Layout/Layout';

export const QuemSomos = () => {
  return (
    <Layout title="Quem somos">
      <div className="bg-cake-cyan rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-cake-text mb-4">Quem Somos</h2>
        <div className="space-y-3 text-cake-text">
          <p>
            Somos uma equipe apaixonada por confeitaria e dedicada a criar experiências
            únicas através de sabores inesquecíveis.
          </p>
          <h3 className="font-bold text-lg mt-4">Nossa Missão</h3>
          <p>
            Proporcionar momentos de felicidade através de produtos artesanais de alta
            qualidade, feitos com ingredientes selecionados e muito amor.
          </p>
          <h3 className="font-bold text-lg mt-4">Nossos Valores</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Qualidade em primeiro lugar</li>
            <li>Atendimento personalizado</li>
            <li>Ingredientes naturais e frescos</li>
            <li>Respeito aos nossos clientes</li>
            <li>Compromisso com a excelência</li>
          </ul>
          <h3 className="font-bold text-lg mt-4">Contato</h3>
          <p>
            Estamos sempre à disposição para atender você! Entre em contato através
            do nosso chat ou redes sociais.
          </p>
        </div>
      </div>
    </Layout>
  );
};



