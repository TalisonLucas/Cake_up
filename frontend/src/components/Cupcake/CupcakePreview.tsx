import type { CupcakeComponent } from '../../types';

interface CupcakePreviewProps {
  massa: CupcakeComponent | null;
  recheio: CupcakeComponent | null;
  cobertura: CupcakeComponent | null;
  total: number;
}

export const CupcakePreview = ({ massa, recheio, cobertura, total }: CupcakePreviewProps) => {
  const isComplete = massa && recheio && cobertura;

  return (
    <div className="sticky top-20 bg-gradient-to-br from-pink-50 to-cyan-50 rounded-2xl p-6 lg:p-8 shadow-lg border-2 border-cake-pink">
      {/* Cupcake Visual */}
      <div className="text-center mb-4">
        <div className="text-9xl lg:text-[120px] 2xl:text-[160px] mb-2">🧁</div>
        <h3 className="text-xl lg:text-2xl font-bold text-cake-text">Seu Cupcake</h3>
      </div>

      {/* Components Selected */}
      <div className="space-y-3 mb-4">
        <div className={`p-3 lg:p-4 rounded-lg ${massa ? 'bg-white' : 'bg-gray-100'}`}>
          <p className="text-xs lg:text-sm text-gray-600 mb-1">Massa:</p>
          <p className="font-semibold text-cake-text lg:text-lg">
            {massa ? massa.name : 'Selecione...'}
          </p>
          {massa && (
            <p className="text-sm lg:text-base text-cake-pink">R$ {massa.price.toFixed(2)}</p>
          )}
        </div>

        <div className={`p-3 lg:p-4 rounded-lg ${recheio ? 'bg-white' : 'bg-gray-100'}`}>
          <p className="text-xs lg:text-sm text-gray-600 mb-1">Recheio:</p>
          <p className="font-semibold text-cake-text lg:text-lg">
            {recheio ? recheio.name : 'Selecione...'}
          </p>
          {recheio && (
            <p className="text-sm lg:text-base text-cake-pink">R$ {recheio.price.toFixed(2)}</p>
          )}
        </div>

        <div className={`p-3 lg:p-4 rounded-lg ${cobertura ? 'bg-white' : 'bg-gray-100'}`}>
          <p className="text-xs lg:text-sm text-gray-600 mb-1">Cobertura:</p>
          <p className="font-semibold text-cake-text lg:text-lg">
            {cobertura ? cobertura.name : 'Selecione...'}
          </p>
          {cobertura && (
            <p className="text-sm lg:text-base text-cake-pink">R$ {cobertura.price.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg lg:text-xl font-semibold text-cake-text">
            Preço Unitário:
          </span>
          <span className="text-2xl lg:text-3xl font-bold text-cake-pink">
            {isComplete ? `R$ ${total.toFixed(2)}` : 'R$ --,--'}
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`h-2 lg:h-3 flex-1 rounded-full ${massa ? 'bg-cake-pink' : 'bg-gray-200'}`} />
        <div className={`h-2 lg:h-3 flex-1 rounded-full ${recheio ? 'bg-cake-pink' : 'bg-gray-200'}`} />
        <div className={`h-2 lg:h-3 flex-1 rounded-full ${cobertura ? 'bg-cake-pink' : 'bg-gray-200'}`} />
      </div>
      <p className="text-xs lg:text-sm text-center text-gray-600 mt-2">
        {!massa && !recheio && !cobertura && 'Comece selecionando a massa'}
        {massa && !recheio && !cobertura && 'Agora escolha o recheio'}
        {massa && recheio && !cobertura && 'Por último, escolha a cobertura'}
        {isComplete && '✓ Cupcake completo!'}
      </p>
    </div>
  );
};


