import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { ComponentSelector } from '../components/Cupcake/ComponentSelector';
import { CupcakePreview } from '../components/Cupcake/CupcakePreview';
import { useCupcakeStore } from '../store/cupcakeStore';
import { massas, recheios, coberturas } from '../mocks/components';
import { HiMinus, HiPlus } from 'react-icons/hi';

export const MontarCupcake = () => {
  const navigate = useNavigate();
  const {
    selectedMassa,
    selectedRecheio,
    selectedCobertura,
    quantity,
    observacoes,
    setMassa,
    setRecheio,
    setCobertura,
    setQuantity,
    setObservacoes,
    addToCart,
  } = useCupcakeStore();

  const total = selectedMassa && selectedRecheio && selectedCobertura
    ? selectedMassa.price + selectedRecheio.price + selectedCobertura.price
    : 0;

  const handleAddToCart = () => {
    const success = addToCart();
    if (success) {
      // Show success message (could use toast)
      alert('Cupcake adicionado ao carrinho!');
      
      // Option: navigate to cart or stay for more
      const goToCart = confirm('Deseja ir para o carrinho ou adicionar mais cupcakes?');
      if (goToCart) {
        navigate('/carrinho');
      }
    } else {
      alert('Por favor, selecione todos os componentes do cupcake.');
    }
  };

  const isComplete = selectedMassa && selectedRecheio && selectedCobertura;

  return (
    <Layout title="Monte seu Cupcake">
      <div className="py-4">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-cake-text mb-2">
            🎂 Crie seu Cupcake Perfeito
          </h2>
          <p className="text-gray-600">
            Personalize cada detalhe do seu cupcake em 3 etapas simples
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selectors */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Massa */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-cake-pink rounded-full text-cake-text font-bold">
                  1
                </span>
                <h3 className="text-lg font-semibold text-cake-text">
                  Escolha a Massa
                </h3>
              </div>
              <ComponentSelector
                type="massa"
                components={massas}
                selected={selectedMassa}
                onSelect={setMassa}
              />
            </div>

            {/* Step 2: Recheio */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-cake-pink rounded-full text-cake-text font-bold">
                  2
                </span>
                <h3 className="text-lg font-semibold text-cake-text">
                  Escolha o Recheio
                </h3>
              </div>
              <ComponentSelector
                type="recheio"
                components={recheios}
                selected={selectedRecheio}
                onSelect={setRecheio}
              />
            </div>

            {/* Step 3: Cobertura */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-cake-pink rounded-full text-cake-text font-bold">
                  3
                </span>
                <h3 className="text-lg font-semibold text-cake-text">
                  Escolha a Cobertura
                </h3>
              </div>
              <ComponentSelector
                type="cobertura"
                components={coberturas}
                selected={selectedCobertura}
                onSelect={setCobertura}
              />
            </div>

            {/* Quantity and Observations */}
            {isComplete && (
              <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
                <h3 className="text-lg font-semibold text-cake-text">
                  ✨ Finalizar Configuração
                </h3>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-cake-text mb-2">
                    Quantidade:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(quantity - 1)}
                      className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      aria-label="Diminuir"
                    >
                      <HiMinus size={20} />
                    </button>
                    <span className="text-2xl font-bold text-cake-text min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      aria-label="Aumentar"
                    >
                      <HiPlus size={20} />
                    </button>
                    <span className="text-sm text-gray-600 ml-2">
                      = R$ {(total * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-sm font-medium text-cake-text mb-2">
                    Observações (opcional):
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Algum pedido especial? Ex: sem açúcar, alergias..."
                    className="w-full px-4 py-3 bg-cake-cyan rounded-lg border-0 focus:ring-2 focus:ring-cake-pink outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-cake-pink hover:bg-cake-dark-pink text-cake-text font-bold text-lg rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  🛒 Adicionar ao Pedido
                </button>
              </div>
            )}
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <CupcakePreview
              massa={selectedMassa}
              recheio={selectedRecheio}
              cobertura={selectedCobertura}
              total={total}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

