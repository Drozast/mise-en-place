import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Download, ShoppingBag } from 'lucide-react';

export default function ReportsNew() {
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [listData, reportData] = await Promise.all([
        api.reports.getShoppingList(),
        api.reports.getDaily(selectedDate),
      ]);
      setShoppingList(listData);
      setDailyReport(reportData);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintShoppingList = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-12 text-dark-300">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Lista de Compras Automática</h1>
          <p className="text-dark-400 mt-2 text-sm max-w-2xl">
            Esta lista se genera automáticamente basándose en los ingredientes que están por debajo de sus umbrales de alerta.
            Los ingredientes críticos (rojos) requieren atención inmediata.
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ShoppingBag className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-1">¿Cómo funciona?</h3>
            <p className="text-sm text-blue-200">
              El sistema monitorea constantemente tu inventario. Cuando un ingrediente alcanza el <strong>umbral de advertencia</strong> (amarillo)
              o el <strong>umbral crítico</strong> (rojo), se agrega automáticamente a esta lista para que sepas qué comprar.
            </p>
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Lista de Compras
          </h2>
          <button
            onClick={handlePrintShoppingList}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Imprimir
          </button>
        </div>

        {shoppingList.length > 0 ? (
          <div className="space-y-3">
            {shoppingList.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-l-4 ${
                  item.priority === 'high'
                    ? 'bg-red-950 border-red-500'
                    : 'bg-yellow-950 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-white">{item.name}</p>
                    <p className="text-sm text-dark-300 mt-1">
                      Categoría: {item.category} • Unidad: {item.unit}
                    </p>
                    <p className="text-sm text-dark-300 mt-1">
                      Stock actual: {item.current_percentage}% • Necesario:{' '}
                      {item.needed_percentage}%
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.priority === 'high'
                        ? 'bg-red-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }`}
                  >
                    {item.priority === 'high' ? 'URGENTE' : 'Medio'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-dark-400 py-8">
            No hay ingredientes que necesiten reposición
          </p>
        )}
      </div>

      {/* Daily Report */}
      {dailyReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Summary */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Ventas del Día</h2>
            {dailyReport.sales?.length > 0 ? (
              <div className="space-y-3">
                {dailyReport.sales.map((sale: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-dark-900 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{sale.name}</p>
                      <p className="text-sm text-dark-400 capitalize">{sale.type}</p>
                    </div>
                    <span className="text-2xl font-bold text-white">{sale.total_quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-dark-400 py-4">No hay ventas registradas</p>
            )}
          </div>

          {/* Shifts Summary */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Turnos del Día</h2>
            {dailyReport.shifts?.length > 0 ? (
              <div className="space-y-3">
                {dailyReport.shifts.map((shift: any) => (
                  <div key={shift.id} className="p-3 bg-dark-900 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">Turno {shift.type}</p>
                        <p className="text-sm text-dark-400">{shift.employee_name}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          shift.status === 'closed'
                            ? 'bg-dark-700 text-dark-300'
                            : 'bg-green-900 text-green-300'
                        }`}
                      >
                        {shift.status === 'closed' ? 'Cerrado' : 'Abierto'}
                      </span>
                    </div>
                    <p className="text-sm text-dark-300">
                      Tareas: {shift.completed_tasks} / {shift.total_tasks} completadas
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-dark-400 py-4">No hay turnos registrados</p>
            )}
          </div>

          {/* Low Stock */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Stock Crítico</h2>
            {dailyReport.lowStock?.length > 0 ? (
              <div className="space-y-2">
                {dailyReport.lowStock.map((item: any) => (
                  <div key={item.name} className="p-3 bg-red-950 rounded-lg">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-dark-300">
                      {item.current_percentage}% • {item.category}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-dark-400 py-4">
                ¡Todo el stock está en buen nivel!
              </p>
            )}
          </div>

          {/* Alerts Summary */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Alertas del Día</h2>
            {dailyReport.alerts?.length > 0 ? (
              <div className="space-y-2">
                {dailyReport.alerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      alert.type === 'critical'
                        ? 'bg-red-950'
                        : alert.type === 'warning'
                        ? 'bg-yellow-950'
                        : 'bg-blue-950'
                    }`}
                  >
                    <p className="font-medium text-white capitalize">{alert.type}</p>
                    <p className="text-sm text-dark-300">Cantidad: {alert.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-dark-400 py-4">No hay alertas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
