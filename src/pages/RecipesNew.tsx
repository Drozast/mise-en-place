import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Package, X } from 'lucide-react';

export default function RecipesNew() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [miseEnPlace, setMiseEnPlace] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState<any>(null);

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
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'orange': return 'text-orange-600 bg-orange-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDelete = async (id: number, recipeName: string) => {
    const confirmed = confirm(
      `⚠️ ADVERTENCIA: Vas a eliminar la receta "${recipeName}".\n\n` +
      'Esta es una operación crítica que afectará:\n' +
      '- El sistema de ventas\n' +
      '- Los cálculos de inventario\n' +
      '- Los reportes históricos\n\n' +
      '¿Estás completamente seguro de que deseas continuar?'
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirm = prompt(
      `Para confirmar, escribe el nombre de la receta exactamente como aparece: "${recipeName}"`
    );

    if (doubleConfirm !== recipeName) {
      alert('El nombre no coincide. Operación cancelada.');
      return;
    }

    try {
      await api.recipes.delete(id);
      alert(`✅ Receta "${recipeName}" eliminada exitosamente`);
      loadData();
    } catch (error) {
      console.error('Error eliminando receta:', error);
      alert('❌ Error al eliminar la receta');
    }
  };

  // Agrupar pizzas por nombre
  const pizzasByName = recipes
    .filter((r) => r.type === 'pizza')
    .reduce((acc: any, recipe: any) => {
      if (!acc[recipe.name]) {
        acc[recipe.name] = [];
      }
      acc[recipe.name].push(recipe);
      return acc;
    }, {});

  // Ordenar por tamaño: L, M, S
  Object.keys(pizzasByName).forEach(name => {
    pizzasByName[name].sort((a: any, b: any) => {
      const order = { 'L': 1, 'M': 2, 'S': 3 };
      return (order[a.size as keyof typeof order] || 0) - (order[b.size as keyof typeof order] || 0);
    });
  });

  const tablas = recipes.filter((r) => r.type === 'tabla');

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          🍕 Menú por Categorías
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar Pizza
        </button>
      </div>

      {/* Tab de Pizzas */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 inline-block">
        <span className="px-4 py-2 bg-orange-600/20 text-orange-600 rounded font-semibold text-sm">
          PIZZAS
        </span>
        <span className="ml-2 text-gray-600 text-sm">
          {Object.keys(pizzasByName).length} pizzas
        </span>
      </div>

      {/* Grid de Pizzas estilo maqueta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(pizzasByName).map(([name, pizzas]: [string, any]) => {
          const uniqueIngredients = pizzas[0].ingredients?.length || 0;
          return (
            <div
              key={name}
              onClick={() => setSelectedPizza({ name, pizzas })}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:border-orange-500 hover:shadow-md transition-all cursor-pointer"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
              <p className="text-gray-600 text-sm">
                {uniqueIngredients} ingredientes
              </p>
            </div>
          );
        })}
      </div>

      {/* Tablas */}
      {tablas.length > 0 && (
        <div className="mt-8">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 inline-block mb-4">
            <span className="px-4 py-2 bg-orange-600/20 text-orange-600 rounded font-semibold text-sm">
              TABLAS
            </span>
            <span className="ml-2 text-gray-600 text-sm">
              {tablas.length} tablas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tablas.map((tabla) => (
              <div
                key={tabla.id}
                className="bg-white border border-gray-200 rounded-lg p-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tabla.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {tabla.ingredients?.length || 0} ingredientes
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(tabla.id, tabla.name)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Eliminar receta (requiere confirmación)"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Pizza con detalles */}
      {selectedPizza && (
        <PizzaDetailModal
          pizza={selectedPizza}
          miseEnPlace={miseEnPlace}
          getMiseStatus={getMiseStatus}
          getStatusColor={getStatusColor}
          getProgressBarColor={getProgressBarColor}
          onClose={() => setSelectedPizza(null)}
          onDelete={handleDelete}
          onReload={loadData}
        />
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

function PizzaDetailModal({ pizza, miseEnPlace, getMiseStatus, getStatusColor, getProgressBarColor, onClose, onDelete, onReload }: any) {
  const { name, pizzas } = pizza;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600/20 p-3 rounded-lg">
              <span className="text-3xl">🍕</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{name}</h2>
              <span className="inline-block mt-1 px-3 py-1 bg-orange-600/20 text-orange-400 rounded-full text-xs font-semibold">
                PIZZAS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              Ingredientes y Receta
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Esta pizza requiere {pizzas[0].ingredients?.length || 0} ingredientes diferentes
            </p>
          </div>

          {/* Ingredientes agrupados por tamaño */}
          <div className="space-y-4">
            {pizzas[0].ingredients?.map((ing: any, idx: number) => {
              const miseStatus = getMiseStatus(ing.ingredient_name);

              // Buscar las cantidades para cada tamaño
              const quantities = {
                L: pizzas.find((p: any) => p.size === 'L')?.ingredients[idx]?.quantity || 0,
                M: pizzas.find((p: any) => p.size === 'M')?.ingredients[idx]?.quantity || 0,
                S: pizzas.find((p: any) => p.size === 'S')?.ingredients[idx]?.quantity || 0,
              };

              return (
                <div
                  key={idx}
                  className="bg-dark-800/50 border border-gray-700/50 rounded-lg p-4"
                >
                  {/* Nombre del ingrediente */}
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-semibold text-lg">{ing.ingredient_name}</h4>
                  </div>

                  {/* Gramajes por tamaño */}
                  <div className="flex gap-4 text-sm text-gray-400 mb-3">
                    <span>Receta L: <span className="text-white font-semibold">{quantities.L} {ing.ingredient_unit}</span></span>
                    <span>Receta M: <span className="text-white font-semibold">{quantities.M} {ing.ingredient_unit}</span></span>
                    <span>Receta S: <span className="text-white font-semibold">{quantities.S} {ing.ingredient_unit}</span></span>
                  </div>

                  {/* Inventario disponible */}
                  {miseStatus ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Inventario Disponible</span>
                        <span className="text-sm font-semibold text-white">
                          {miseStatus.current}{miseStatus.unit} / {miseStatus.initial}{miseStatus.unit}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressBarColor(miseStatus.status)}`}
                          style={{ width: `${miseStatus.percentage}%` }}
                        />
                      </div>

                      {/* Status badge */}
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(miseStatus.status)}`}>
                        {miseStatus.percentage}% disponible
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No hay turno abierto con mise en place
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div className="mt-6 pt-6 border-t border-gray-700 flex gap-3">
            {pizzas.map((p: any) => (
              <button
                key={p.id}
                onClick={async () => {
                  if (confirm(`¿Eliminar ${name} tamaño ${p.size}?`)) {
                    await onDelete(p.id);
                    onReload();
                    // Si no quedan más tamaños, cerrar modal
                    const remaining = pizzas.filter((x: any) => x.id !== p.id);
                    if (remaining.length === 0) {
                      onClose();
                    }
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-semibold"
              >
                Eliminar tamaño {p.size}
              </button>
            ))}
          </div>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Nueva Receta</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nombre</label>
            <input
              type="text"
              required
              className="w-full bg-dark-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Margarita"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
              <select
                className="w-full bg-dark-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
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
                <label className="block text-sm font-medium text-gray-400 mb-2">Tamaño</label>
                <select
                  className="w-full bg-dark-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
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
              <label className="block text-sm font-medium text-gray-400">Ingredientes</label>
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
                    className="flex-1 bg-dark-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
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
                    className="w-28 bg-dark-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors font-medium"
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
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
