import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Package } from 'lucide-react';

export default function RecipesNew() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [miseEnPlace, setMiseEnPlace] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
    loadMiseEnPlace();

    // Actualizar mise en place cada 15 segundos
    const interval = setInterval(loadMiseEnPlace, 15000);
    return () => clearInterval(interval);
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

  const loadMiseEnPlace = async () => {
    try {
      const response = await fetch('/api/shifts/current/mise-en-place');
      if (response.ok) {
        const data = await response.json();
        setMiseEnPlace(data.mise_en_place || []);
      } else {
        setMiseEnPlace([]);
      }
    } catch (error) {
      console.error('Error cargando mise en place:', error);
      setMiseEnPlace([]);
    }
  };

  const getMiseStatus = (ingredientName: string) => {
    const mise = miseEnPlace.find((m: any) => m.ingredient_name === ingredientName);
    if (!mise) return null;
    return {
      current: Math.round(mise.current_quantity),
      initial: Math.round(mise.initial_quantity),
      percentage: mise.percentage,
      status: mise.status,
      unit: mise.unit
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'yellow': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'orange': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'red': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-dark-400 bg-gray-50 dark:bg-gray-900/20';
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

  // Agrupar pizzas por nombre (para mostrar todos los tamaños juntos)
  const pizzasByName = recipes
    .filter((r) => r.type === 'pizza')
    .reduce((acc: any, recipe: any) => {
      if (!acc[recipe.name]) {
        acc[recipe.name] = [];
      }
      acc[recipe.name].push(recipe);
      return acc;
    }, {});

  // Ordenar por tamaño: S, M, L
  Object.keys(pizzasByName).forEach(name => {
    pizzasByName[name].sort((a: any, b: any) => {
      const order = { 'S': 1, 'M': 2, 'L': 3 };
      return (order[a.size as keyof typeof order] || 0) - (order[b.size as keyof typeof order] || 0);
    });
  });

  const tablas = recipes.filter((r) => r.type === 'tabla');

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-dark-300">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recetas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Receta
        </button>
      </div>

      {miseEnPlace.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Package className="w-5 h-5" />
            <p className="text-sm font-semibold">
              Mostrando disponibilidad en tiempo real del Mise en Place del turno actual
            </p>
          </div>
        </div>
      )}

      {/* Pizzas agrupadas por nombre */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🍕 Pizzas ({Object.keys(pizzasByName).length})
        </h2>

        {Object.entries(pizzasByName).map(([name, pizzas]: [string, any]) => (
          <div key={name} className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pizzas.map((pizza: any) => (
                <div
                  key={pizza.id}
                  className="bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Tamaño {pizza.size || 'M'}
                    </span>
                    <button
                      onClick={() => handleDelete(pizza.id)}
                      className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-dark-300 mb-2">Ingredientes:</p>
                    <ul className="space-y-2">
                      {pizza.ingredients?.map((ing: any) => {
                        const miseStatus = getMiseStatus(ing.ingredient_name);
                        return (
                          <li key={ing.id} className="text-sm">
                            <div className="flex justify-between items-start">
                              <span className="text-gray-900 dark:text-white font-medium">
                                {ing.ingredient_name}
                              </span>
                              <span className="text-gray-600 dark:text-dark-400 font-semibold">
                                {ing.quantity} {ing.ingredient_unit}
                              </span>
                            </div>
                            {miseStatus && (
                              <div className={`mt-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(miseStatus.status)}`}>
                                <div className="flex justify-between items-center">
                                  <span>Disponible: {miseStatus.current}/{miseStatus.initial} {miseStatus.unit}</span>
                                  <span>{miseStatus.percentage}%</span>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tablas */}
      {tablas.length > 0 && (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            🍽️ Tablas ({tablas.length})
          </h2>
          <div className="space-y-4">
            {tablas.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg p-4"
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
                  <ul className="space-y-2">
                    {recipe.ingredients?.map((ing: any) => {
                      const miseStatus = getMiseStatus(ing.ingredient_name);
                      return (
                        <li key={ing.id} className="text-sm">
                          <div className="flex justify-between items-start">
                            <span className="text-gray-900 dark:text-white font-medium">
                              {ing.ingredient_name}
                            </span>
                            <span className="text-gray-600 dark:text-dark-400 font-semibold">
                              {ing.quantity} {ing.ingredient_unit}
                            </span>
                          </div>
                          {miseStatus && (
                            <div className={`mt-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(miseStatus.status)}`}>
                              <div className="flex justify-between items-center">
                                <span>Disponible: {miseStatus.current}/{miseStatus.initial} {miseStatus.unit}</span>
                                <span>{miseStatus.percentage}%</span>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    size: 'M' as 'S' | 'M' | 'L',
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
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nueva Receta</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Nombre</label>
            <input
              type="text"
              required
              className="w-full bg-white dark:bg-dark-700 border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-dark-500 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Margarita"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Tipo</label>
              <select
                className="w-full bg-white dark:bg-dark-700 border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'pizza' | 'tabla' })
                }
              >
                <option value="pizza">Pizza</option>
                <option value="tabla">Tabla</option>
              </select>
            </div>

            {formData.type === 'pizza' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Tamaño</label>
                <select
                  className="w-full bg-white dark:bg-dark-700 border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value as 'S' | 'M' | 'L' })
                  }
                >
                  <option value="S">S (Individual)</option>
                  <option value="M">M (Mediana)</option>
                  <option value="L">L (Familiar)</option>
                </select>
              </div>
            )}
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
                    className="flex-1 bg-white dark:bg-dark-700 border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
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
                    className="w-28 bg-white dark:bg-dark-700 border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-dark-500 focus:outline-none focus:border-orange-500 transition-colors font-medium"
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
