import { Layout } from '../components/Layout/Layout';

export const Historia = () => {
  return (
    <Layout title="História">
      <div className="bg-cake-cyan rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-cake-text mb-4">Nossa História</h2>
        <div className="space-y-3 text-cake-text">
          <p>
            A Cake Up nasceu do sonho de transformar momentos especiais em memórias
            ainda mais doces. Fundada em 2020, começamos como uma pequena confeitaria
            caseira, feita com muito amor e dedicação.
          </p>
          <p>
            Cada bolo, doce e sobremesa é preparado com ingredientes selecionados e
            receitas exclusivas, mantendo a tradição de fazer tudo com carinho, como
            se fosse para a nossa própria família.
          </p>
          <p>
            Hoje, atendemos clientes em toda a região, mas mantemos o mesmo
            compromisso de qualidade e atenção aos detalhes que nos tornou especiais
            desde o início.
          </p>
          <p className="font-semibold">
            Venha fazer parte da nossa história! 🎂
          </p>
        </div>
      </div>
    </Layout>
  );
};



