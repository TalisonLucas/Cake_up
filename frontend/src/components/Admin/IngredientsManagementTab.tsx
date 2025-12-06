import { useState, useEffect } from 'react';
import { cupcakeComponentsApi } from '../../services/api';
import type { CupcakeComponent } from '../../types';
import { HiCheckCircle, HiXCircle, HiRefresh } from 'react-icons/hi';

export const IngredientsManagementTab = () => {
  const [ingredients, setIngredients] = useState<CupcakeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      // Buscar todos os ingredientes (incluindo pausados) para admin/operador
      const allIngredients = await cupcakeComponentsApi.getAll(true);
      setIngredients(allIngredients);
    } catch (error) {
      console.error('Erro ao carregar ingredientes:', error);
      alert('Erro ao carregar ingredientes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (ingredient: CupcakeComponent) => {
    setUpdating(ingredient.id);
    try {
      const newAvailability = !ingredient.disponivel;
      await cupcakeComponentsApi.updateAvailability(ingredient.id, newAvailability);
      
      // Atualizar estado local
      setIngredients(prev => 
        prev.map(ing => 
          ing.id === ingredient.id 
            ? { ...ing, disponivel: newAvailability }
            : ing
        )
      );
    } catch (error: any) {
      console.error('Erro ao atualizar disponibilidade:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Erro ao atualizar disponibilidade';
      alert(`Erro ao atualizar disponibilidade: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  const groupByType = (ingredients: CupcakeComponent[]) => {
    return {
      massa: ingredients.filter(ing => ing.type === 'massa'),
      recheio: ingredients.filter(ing => ing.type === 'recheio'),
      cobertura: ingredients.filter(ing => ing.type === 'cobertura'),
    };
  };

  const grouped = groupByType(ingredients);

  const IngredientCard = ({ ingredient }: { ingredient: CupcakeComponent }) => {
    const isUpdating = updating === ingredient.id;
    
    return (
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-800">{ingredient.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                ingredient.disponivel
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {ingredient.disponivel ? 'Disponível' : 'Pausado'}
              </span>
            </div>
            {ingredient.description && (
              <p className="text-sm text-gray-600 mb-2">{ingredient.description}</p>
            )}
            <p className="text-lg font-semibold text-purple-600">R$ {ingredient.price.toFixed(2)}</p>
          </div>
          <button
            onClick={() => handleToggleAvailability(ingredient)}
            disabled={isUpdating}
            className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
              ingredient.disponivel
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-300'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUpdating ? (
              <>
                <HiRefresh className="animate-spin" size={20} />
                <span>Atualizando...</span>
              </>
            ) : ingredient.disponivel ? (
              <>
                <HiXCircle size={20} />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <HiCheckCircle size={20} />
                <span>Retomar</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const TypeSection = ({ 
    title, 
    ingredients 
  }: { 
    title: string; 
    ingredients: CupcakeComponent[];
  }) => {
    const availableCount = ingredients.filter(ing => ing.disponivel).length;
    const totalCount = ingredients.length;

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
            <p className="text-sm text-gray-600">
              {availableCount} de {totalCount} disponíveis
            </p>
          </div>
        </div>
        {ingredients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum ingrediente cadastrado
          </div>
        ) : (
          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
            {ingredients.map(ingredient => (
              <IngredientCard key={ingredient.id} ingredient={ingredient} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Carregando ingredientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
        <div className="flex flex-col desktop:flex-row gap-4 items-start desktop:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Gerenciar Ingredientes</h2>
            <p className="text-gray-600">Pause ou retome a disponibilidade dos ingredientes para os clientes</p>
          </div>
          <button
            onClick={loadIngredients}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <HiRefresh size={20} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Seções por tipo */}
      <TypeSection 
        title="Massas" 
        ingredients={grouped.massa} 
      />
      <TypeSection 
        title="Recheios" 
        ingredients={grouped.recheio} 
      />
      <TypeSection 
        title="Coberturas" 
        ingredients={grouped.cobertura} 
      />
    </div>
  );
};
