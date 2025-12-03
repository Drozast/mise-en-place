import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Download, ShoppingBag } from 'lucide-react';
import { getSocket } from '../lib/socket';

export default function ReportsNew() {
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();

    // Set up socket listeners for real-time updates
    const socket = getSocket();

    socket.on('ingredient:updated', () => {
      loadData();
    });

    socket.on('ingredient:restocked', () => {
      loadData();
    });

    socket.on('sale:registered', () => {
      loadData();
    });

    socket.on('alert:created', () => {
      loadData();
    });

    return () => {
      socket.off('ingredient:updated');
      socket.off('ingredient:restocked');
      socket.off('sale:registered');
      socket.off('alert:created');
    };
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
    return <div className="text-center py-12 text-gray-600">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista de Compras Automática</h1>
          <p className="text-gray-600 mt-2 text-sm max-w-2xl">
            Esta lista se genera automáticamente basándose en los ingredientes que están por debajo de sus umbrales de alerta.
            Los ingredientes críticos (rojos) requieren atención inmediata.
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ShoppingBag className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">¿Cómo funciona?</h3>
            <p className="text-sm text-blue-800">
              El sistema monitorea constantemente tu inventario. Cuando un ingrediente alcanza el <strong>umbral de advertencia</strong> (amarillo)
              o el <strong>umbral crítico</strong> (rojo), se agrega automáticamente a esta lista para que sepas qué comprar.
            </p>
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
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
                    ? 'bg-red-50 border-red-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Categoría: {item.category} • Unidad: {item.unit}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
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
          <p className="text-center text-gray-500 py-8">
            No hay ingredientes que necesiten reposición
          </p>
        )}
      </div>

      {/* Daily Report */}
      {dailyReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ventas del Día</h2>
            {dailyReport.sales?.length > 0 ? (
              <div className="space-y-3">
                {dailyReport.sales.map((sale: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{sale.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{sale.type}</p>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{sale.total_quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No hay ventas registradas</p>
            )}
          </div>

          {/* Shifts Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Turnos del Día</h2>
            {dailyReport.shifts?.length > 0 ? (
              <div className="space-y-3">
                {dailyReport.shifts.map((shift: any) => (
                  <div key={shift.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">Turno {shift.type}</p>
                        <p className="text-sm text-gray-600">{shift.employee_name}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          shift.status === 'closed'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {shift.status === 'closed' ? 'Cerrado' : 'Abierto'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Tareas: {shift.completed_tasks} / {shift.total_tasks} completadas
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No hay turnos registrados</p>
            )}
          </div>

          {/* Low Stock */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Crítico</h2>
            {dailyReport.lowStock?.length > 0 ? (
              <div className="space-y-2">
                {dailyReport.lowStock.map((item: any) => (
                  <div key={item.name} className="p-3 bg-red-50 rounded-lg">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-700">
                      {item.current_percentage}% • {item.category}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                ¡Todo el stock está en buen nivel!
              </p>
            )}
          </div>

          {/* Alerts Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Alertas del Día</h2>
            {dailyReport.alerts?.length > 0 ? (
              <div className="space-y-2">
                {dailyReport.alerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      alert.type === 'critical'
                        ? 'bg-red-50'
                        : alert.type === 'warning'
                        ? 'bg-yellow-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900 capitalize">{alert.type}</p>
                    <p className="text-sm text-gray-700">Cantidad: {alert.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No hay alertas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
