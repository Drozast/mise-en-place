import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { Clock, CheckCircle, Circle, XCircle, AlertTriangle, Package } from 'lucide-react';

export default function ShiftsNew() {
  const { currentShift, setCurrentShift, user } = useStore();
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadCurrentShift();
  }, []);

  const loadCurrentShift = async () => {
    try {
      const shift = await api.shifts.getCurrent();
      setCurrentShift(shift);
    } catch (error) {
      console.error('Error cargando turno:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, completed: boolean) => {
    if (!currentShift) return;

    try {
      await api.shifts.updateTask(currentShift.id, taskId, !completed);
      loadCurrentShift();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  const handleCloseShift = async (forceClose = false) => {
    if (!currentShift) return;

    // Verificar si hay tareas pendientes
    const pendingTasks = currentShift.tasks?.filter((t: any) => !t.completed) || [];

    if (pendingTasks.length > 0 && !forceClose) {
      // Si hay tareas pendientes y el usuario es chef, mostrar modal de autorización
      if (user?.role === 'chef') {
        setShowAuthModal(true);
        return;
      } else {
        // Si es empleado, no puede cerrar sin completar todas las tareas
        alert(`No puedes cerrar el turno sin completar todas las tareas. Faltan ${pendingTasks.length} tareas pendientes.`);
        return;
      }
    }

    if (!confirm('¿Estás seguro de cerrar el turno?')) return;

    try {
      await api.shifts.close(currentShift.id);
      loadCurrentShift();
      setShowAuthModal(false);
      alert('Turno cerrado exitosamente');
    } catch (error: any) {
      alert(error.message || 'Error al cerrar turno');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dark-300">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Checklist</h1>
        {!currentShift && (
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Clock className="w-5 h-5" />
            Abrir Turno
          </button>
        )}
      </div>

      {currentShift ? (
        <div className="space-y-6">
          {/* Shift Info */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Turno {currentShift.type} - {currentShift.employee_name}
                </h2>
                <p className="text-dark-400 mt-1">
                  {new Date(currentShift.date).toLocaleDateString('es-ES')} •{' '}
                  {new Date(currentShift.start_time).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className="px-4 py-2 bg-green-900 text-green-300 rounded-lg text-sm font-semibold">
                Abierto
              </span>
            </div>
          </div>

          {/* Tasks Checklist */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Tareas del Turno
              <span className="ml-3 text-base text-dark-400 font-normal">
                ({currentShift.tasks?.filter((t: any) => t.completed).length || 0} /{' '}
                {currentShift.tasks?.length || 0})
              </span>
            </h2>
            <div className="space-y-2">
              {currentShift.tasks?.map((task: any, index: number) => {
                const previousTask = index > 0 ? currentShift.tasks[index - 1] : null;
                let timeElapsed = null;

                if (task.completed && task.completed_at) {
                  if (previousTask?.completed_at) {
                    // Calcular tiempo entre esta tarea y la anterior
                    const currentTime = new Date(task.completed_at).getTime();
                    const previousTime = new Date(previousTask.completed_at).getTime();
                    const diffMinutes = Math.round((currentTime - previousTime) / 60000);
                    timeElapsed = diffMinutes;
                  } else if (index === 0) {
                    // Para la primera tarea, calcular desde el inicio del turno
                    const taskTime = new Date(task.completed_at).getTime();
                    const shiftTime = new Date(currentShift.start_time).getTime();
                    const diffMinutes = Math.round((taskTime - shiftTime) / 60000);
                    timeElapsed = diffMinutes;
                  }
                }

                return (
                  <div
                    key={task.id}
                    className={`rounded-lg border-2 transition-all ${
                      task.completed
                        ? 'bg-green-950 border-green-800'
                        : 'bg-dark-900 border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={() => handleToggleTask(task.id, task.completed)}
                    >
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-dark-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span
                          className={`${
                            task.completed ? 'line-through text-dark-400' : 'text-white'
                          }`}
                        >
                          {task.task_name}
                        </span>
                      </div>
                      {task.completed && task.completed_at && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-300">
                            {new Date(task.completed_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {timeElapsed !== null && (
                            <div className="text-xs text-dark-400">
                              {timeElapsed > 0 ? `+${timeElapsed}` : timeElapsed} min
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close Shift Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCloseShift}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Cerrar Turno
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No hay turno abierto</h2>
          <p className="text-dark-400 mb-6">
            Abre un nuevo turno para comenzar a trabajar
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Clock className="w-5 h-5" />
            Abrir Turno
          </button>
        </div>
      )}

      {showOpenModal && (
        <OpenShiftModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={() => {
            loadCurrentShift();
            setShowOpenModal(false);
          }}
        />
      )}

      {showAuthModal && currentShift && (
        <AuthorizationModal
          pendingTasks={currentShift.tasks?.filter((t: any) => !t.completed) || []}
          onClose={() => setShowAuthModal(false)}
          onAuthorize={() => handleCloseShift(true)}
        />
      )}
    </div>
  );
}

function OpenShiftModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'AM' as 'AM' | 'PM',
    employee_name: '',
  });
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useStore((state) => state.user);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.shifts.create(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const lowStockItems = ingredients.filter(
    (i) => i.current_percentage <= i.warning_threshold
  );
  const criticalItems = ingredients.filter(
    (i) => i.current_percentage <= i.critical_threshold
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-3xl my-8">
        <h2 className="text-2xl font-bold text-white mb-6">Abrir Nuevo Turno</h2>

        {/* Inventory Summary */}
        {!loading && (
          <div className="mb-6 space-y-4">
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-blue-300">Estado del Inventario Actual</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{ingredients.length}</div>
                  <div className="text-xs text-dark-400">Total Ingredientes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{lowStockItems.length}</div>
                  <div className="text-xs text-dark-400">Stock Bajo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{criticalItems.length}</div>
                  <div className="text-xs text-dark-400">Críticos</div>
                </div>
              </div>
            </div>

            {criticalItems.length > 0 && (
              <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-300 mb-2 text-sm">⚠️ Ingredientes Críticos:</h4>
                <div className="space-y-1">
                  {criticalItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="text-xs text-red-200 flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.current_percentage}%</span>
                    </div>
                  ))}
                  {criticalItems.length > 5 && (
                    <div className="text-xs text-red-300 italic">
                      +{criticalItems.length - 5} más...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Fecha</label>
            <input
              type="date"
              required
              className="w-full bg-white border-2 border-dark-600 rounded-lg px-4 py-3 text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Tipo de Turno
            </label>
            <select
              className="w-full bg-white border-2 border-dark-600 rounded-lg px-4 py-3 text-dark-900 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'AM' | 'PM' })}
            >
              <option value="AM">AM (Preparación)</option>
              <option value="PM">PM (Servicio)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nombre del Empleado
            </label>
            <input
              type="text"
              required
              placeholder="Nombre completo"
              className="w-full bg-white border-2 border-dark-600 rounded-lg px-4 py-3 text-dark-900 placeholder-dark-400 focus:outline-none focus:border-orange-500 transition-colors font-medium"
              value={formData.employee_name}
              onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Abrir Turno
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

function AuthorizationModal({ pendingTasks, onClose, onAuthorize }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border-2 border-orange-600 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Autorización Requerida</h2>
        </div>

        <div className="bg-orange-950 border border-orange-800 rounded-lg p-4 mb-6">
          <p className="text-orange-200 mb-2">
            <strong>Atención:</strong> Hay {pendingTasks.length} tarea(s) pendiente(s) sin completar:
          </p>
          <ul className="space-y-1 mt-3">
            {pendingTasks.map((task: any) => (
              <li key={task.id} className="text-sm text-orange-300 flex items-center gap-2">
                <Circle className="w-3 h-3" />
                {task.task_name}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-dark-300 mb-6 text-sm">
          Como Chef/Admin, puedes autorizar el cierre del turno a pesar de las tareas pendientes.
          ¿Deseas continuar?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onAuthorize}
            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
          >
            Autorizar y Cerrar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
