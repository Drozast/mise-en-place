import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

export default function IngredientsNew() {
  const { ingredients, setIngredients } = useStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const data = await api.ingredients.getAll();
      setIngredients(data);
    } catch (error) {
      console.error('Error cargando ingredientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = (ingredient: any) => {
    setSelectedIngredient(ingredient);
    setShowRestockModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este ingrediente?')) return;

    try {
      await api.ingredients.delete(id);
      loadIngredients();
    } catch (error) {
      console.error('Error eliminando ingrediente:', error);
    }
  };

  const getPercentageColor = (percentage: number, critical: number, warning: number) => {
    if (percentage <= critical) return 'bg-red-500';
    if (percentage <= warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const categories = [...new Set(ingredients.map((i) => i.category))];

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-dark-300">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventario Real</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ingrediente
        </button>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryIngredients = ingredients.filter((i) => i.category === category);

          return (
            <div key={category} className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 capitalize">{category}</h2>
              <div className="space-y-3">
                {categoryIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg hover:border-orange-500 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-lg text-gray-900 dark:text-white">
                          {ingredient.name}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {ingredient.current_quantity || Math.round((ingredient.current_percentage / 100) * (ingredient.total_quantity || 1000))}{ingredient.unit} / {ingredient.total_quantity || 1000}{ingredient.unit}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-dark-400">
                            {ingredient.current_percentage}% disponible
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getPercentageColor(
                                ingredient.current_percentage,
                                ingredient.critical_threshold,
                                ingredient.warning_threshold
                              )}`}
                              style={{ width: `${ingredient.current_percentage}%` }}
                            />
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold min-w-[50px] text-right ${
                            ingredient.current_percentage <= ingredient.critical_threshold
                              ? 'text-red-400'
                              : ingredient.current_percentage <= ingredient.warning_threshold
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          {ingredient.current_percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestock(ingredient)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restoquear
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <AddIngredientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadIngredients();
            setShowAddModal(false);
          }}
        />
      )}

      {showRestockModal && selectedIngredient && (
        <RestockModal
          ingredient={selectedIngredient}
          onClose={() => {
            setShowRestockModal(false);
            setSelectedIngredient(null);
          }}
          onSuccess={() => {
            loadIngredients();
            setShowRestockModal(false);
            setSelectedIngredient(null);
          }}
        />
      )}
    </div>
  );
}

function AddIngredientModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'g',
    category: '',
    critical_threshold: 20,
    warning_threshold: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.ingredients.create(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nuevo Ingrediente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Nombre</label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Unidad de Medida</label>
            <select
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <optgroup label="Peso">
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
              </optgroup>
              <optgroup label="Volumen">
                <option value="L">Litros (L)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="cc">Centímetros cúbicos (cc)</option>
              </optgroup>
              <optgroup label="Cantidad">
                <option value="unidades">Unidades</option>
                <option value="piezas">Piezas</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Categoría</label>
            <input
              type="text"
              required
              placeholder="proteínas, vegetales, lácteos, etc."
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Umbral Crítico (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                value={formData.critical_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, critical_threshold: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Umbral Advertencia (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
                value={formData.warning_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, warning_threshold: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Crear
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

function RestockModal({ ingredient, onClose, onSuccess }: any) {
  const [newPercentage, setNewPercentage] = useState(100);
  const [authorizedBy, setAuthorizedBy] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.ingredients.restock(ingredient.id, {
        new_percentage: newPercentage,
        authorized_by: authorizedBy,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Restoquear: {ingredient.name}
        </h2>
        <div className="mb-6 p-4 bg-gray-100 dark:bg-dark-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-dark-400">Nivel actual</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{ingredient.current_percentage}%</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Nuevo Porcentaje
            </label>
            <input
              type="number"
              min="0"
              max="100"
              required
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={newPercentage}
              onChange={(e) => setNewPercentage(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Autorizado por
            </label>
            <input
              type="text"
              required
              placeholder="Nombre del encargado"
              className="w-full bg-gray-50 dark:bg-white border-2 border-gray-300 dark:border-dark-600 rounded-lg px-4 py-3 text-gray-900 dark:text-dark-900 placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Restoquear
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
