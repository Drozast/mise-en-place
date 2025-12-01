import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Plus, Clock } from 'lucide-react';

export default function SalesNew() {
  const navigate = useNavigate();
  const { currentShift } = useStore();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipesData, salesData] = await Promise.all([
        api.recipes.getAll(),
        api.sales.getAll({ date: new Date().toISOString().split('T')[0] }),
      ]);
      setRecipes(recipesData);
      setSales(salesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dark-300">Cargando...</div>;
  }

  const pizzas = recipes.filter((r) => r.type === 'pizza');
  const tablas = recipes.filter((r) => r.type === 'tabla');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Registro de Ventas</h1>
        {currentShift && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Registrar Venta
          </button>
        )}
      </div>

      {!currentShift ? (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-12 text-center">
          <Clock className="w-20 h-20 text-dark-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            No hay turno abierto
          </h2>
          <p className="text-dark-400 mb-8 max-w-md mx-auto">
            Debes abrir un turno antes de poder registrar ventas. ¿Deseas abrir un turno ahora?
          </p>
          <button
            onClick={() => navigate('/checklist')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
          >
            <Clock className="w-5 h-5" />
            Ir a Abrir Turno
          </button>
        </div>
      ) : (
        <>
          {/* Quick Sale Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pizzas */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🍕 Pizzas</h2>
              <div className="grid grid-cols-2 gap-3">
                {pizzas.map((recipe) => (
                  <QuickSaleButton
                    key={recipe.id}
                    recipe={recipe}
                    currentShift={currentShift}
                    onSuccess={loadData}
                  />
                ))}
              </div>
            </div>

            {/* Tablas */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🍽️ Tablas</h2>
              <div className="grid grid-cols-2 gap-3">
                {tablas.map((recipe) => (
                  <QuickSaleButton
                    key={recipe.id}
                    recipe={recipe}
                    currentShift={currentShift}
                    onSuccess={loadData}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sales History */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Ventas de Hoy</h2>
            {sales.length > 0 ? (
              <div className="space-y-2">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex justify-between items-center p-4 bg-dark-900 border border-dark-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{sale.recipe_name}</p>
                      <p className="text-sm text-dark-400">
                        {new Date(sale.timestamp).toLocaleTimeString('es-ES')}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-white">×{sale.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-dark-400 py-8">
                No hay ventas registradas hoy
              </p>
            )}
          </div>
        </>
      )}

      {showModal && currentShift && (
        <SaleModal
          recipes={recipes}
          currentShift={currentShift}
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

function QuickSaleButton({ recipe, currentShift, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await api.sales.create({
        shift_id: currentShift.id,
        recipe_id: recipe.id,
        quantity: 1,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-4 bg-dark-900 border-2 border-dark-700 rounded-lg hover:border-orange-500 hover:bg-dark-800 transition-all disabled:opacity-50 text-left"
    >
      <p className="font-semibold text-white">{recipe.name}</p>
      <p className="text-xs text-dark-400 mt-1">Click para +1</p>
    </button>
  );
}

function SaleModal({ recipes, currentShift, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    recipe_id: 0,
    quantity: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sales.create({
        shift_id: currentShift.id,
        ...formData,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Registrar Venta</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Receta</label>
            <select
              className="w-full bg-white border-2 border-dark-600 rounded-lg px-4 py-3 text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.recipe_id}
              onChange={(e) =>
                setFormData({ ...formData, recipe_id: parseInt(e.target.value) })
              }
              required
            >
              <option value={0}>Seleccionar...</option>
              <optgroup label="Pizzas">
                {recipes
                  .filter((r: any) => r.type === 'pizza')
                  .map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Tablas">
                {recipes
                  .filter((r: any) => r.type === 'tabla')
                  .map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Cantidad</label>
            <input
              type="number"
              min="1"
              required
              className="w-full bg-white border-2 border-dark-600 rounded-lg px-4 py-3 text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
