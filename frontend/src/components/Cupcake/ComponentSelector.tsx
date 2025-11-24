import type { CupcakeComponent, ComponentType } from '../../types';

interface ComponentSelectorProps {
  type: ComponentType;
  components: CupcakeComponent[];
  selected: CupcakeComponent | null;
  onSelect: (component: CupcakeComponent) => void;
}

export const ComponentSelector = ({
  type,
  components,
  selected,
  onSelect,
}: ComponentSelectorProps) => {
  const getTypeLabel = (type: ComponentType): string => {
    switch (type) {
      case 'massa':
        return 'Escolha a Massa';
      case 'recheio':
        return 'Escolha o Recheio';
      case 'cobertura':
        return 'Escolha a Cobertura';
      default:
        return 'Escolha';
    }
  };

  const getEmoji = (type: ComponentType): string => {
    switch (type) {
      case 'massa':
        return '🧁';
      case 'recheio':
        return '🍫';
      case 'cobertura':
        return '🍰';
      default:
        return '🎂';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-cake-text flex items-center gap-2">
        <span className="text-2xl">{getEmoji(type)}</span>
        {getTypeLabel(type)}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {components.map((component) => (
          <button
            key={component.id}
            onClick={() => component.disponivel && onSelect(component)}
            disabled={!component.disponivel}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              selected?.id === component.id
                ? 'border-cake-pink bg-pink-50 shadow-md scale-105'
                : component.disponivel
                ? 'border-gray-200 bg-white hover:border-cake-pink hover:shadow-md'
                : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-cake-text">
                    {component.name}
                  </h4>
                  {selected?.id === component.id && (
                    <span className="text-xl">✓</span>
                  )}
                </div>
                {component.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {component.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-cake-pink">
                    + R$ {component.price.toFixed(2)}
                  </span>
                  {component.estoque !== undefined && component.estoque < 20 && (
                    <span className="text-xs text-orange-600 font-medium">
                      Estoque baixo: {component.estoque}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!component.disponivel && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl">
                <span className="text-sm font-medium text-red-600">
                  Indisponível
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

