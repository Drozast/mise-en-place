import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2 } from 'lucide-react';

export default function RecipesNew() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipesData, ingredientsData] = await Promise.all([
        api.recipes.getAll(),
        api.ingredients.getAll(),
      ]);
      setRecipes(recipesData);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta receta?')) return;

    try {
      await api.recipes.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando receta:', error);
    }
  };

  const pizzas = recipes.filter((r) => r.type === 'pizza');
  const tablas = recipes.filter((r) => r.type === 'tabla');

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-dark-300">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Receta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pizzas */}
        <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            🍕 Pizzas ({pizzas.length})
          </h2>
          <div className="space-y-4">
            {pizzas.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:border-orange-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-dark-300 mb-2">Ingredientes:</p>
                  <ul className="space-y-1">
                    {recipe.ingredients?.map((ing: any) => (
                      <li key={ing.id} className="text-sm text-gray-600 dark:text-dark-400">
                        • {ing.ingredient_name}: {ing.quantity} {ing.ingredient_unit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tablas */}
        <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            🍽️ Tablas ({tablas.length})
          </h2>
          <div className="space-y-4">
            {tablas.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:border-orange-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-dark-300 mb-2">Ingredientes:</p>
                  <ul className="space-y-1">
                    {recipe.ingredients?.map((ing: any) => (
                      <li key={ing.id} className="text-sm text-gray-600 dark:text-dark-400">
                        • {ing.ingredient_name}: {ing.quantity} {ing.ingredient_unit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <RecipeModal
          ingredients={ingredients}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            loadData();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function RecipeModal({ ingredients, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'pizza' as 'pizza' | 'tabla',
    ingredients: [] as { ingredient_id: number; quantity: number }[],
  });

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredient_id: 0, quantity: 1 }],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const updated = [...formData.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ingredients: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recipes.create(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nueva Receta</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Nombre</label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Margarita"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Tipo</label>
            <select
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'pizza' | 'tabla' })
              }
            >
              <option value="pizza">Pizza</option>
              <option value="tabla">Tabla</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300">Ingredientes</label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            <div className="space-y-2">
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    className="flex-1 bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                    value={ing.ingredient_id}
                    onChange={(e) =>
                      handleIngredientChange(index, 'ingredient_id', parseInt(e.target.value))
                    }
                    required
                  >
                    <option value={0}>Seleccionar ingrediente...</option>
                    {ingredients.map((ingredient: any) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Cantidad"
                    className="w-28 bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                    value={ing.quantity}
                    onChange={(e) =>
                      handleIngredientChange(index, 'quantity', parseFloat(e.target.value))
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Crear Receta
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
