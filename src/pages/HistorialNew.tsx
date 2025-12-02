import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Sale {
  id: number;
  recipe_name: string;
  quantity: number;
  timestamp: string;
  size?: string;
}

interface Alert {
  id: number;
  ingredient_name: string;
  current_percentage: number;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export default function HistorialNew() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesRes] = await Promise.all([
        api.sales.getAll(),
      ]);

      // Filter sales for today
      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesRes.filter((s: Sale) => {
        const saleDate = new Date(s.timestamp).toISOString().split('T')[0];
        return saleDate === today;
      });

      setSales(todaySales);
      // TODO: Load alerts from API when endpoint is ready
      setAlerts([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTransactions = sales.length;
  const resolvedAlerts = alerts.filter(a => a.resolved).length;
  const pendingAlerts = alerts.filter(a => !a.resolved).length;

  // Group sales by hour
  const salesByHour = sales.reduce((acc, sale) => {
    const hour = new Date(sale.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + sale.quantity;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historial</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-dark-400 mb-2">
            Total Transacciones
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalTransactions}
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-500 mt-1">
            {totalTransactions === 1 ? '1 registro' : `${totalTransactions} registros`}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-dark-400 mb-2">
            Alertas Resueltas
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-500">
            {resolvedAlerts}
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-500 mt-1">
            {resolvedAlerts === 1 ? '1 reposición completada' : `${resolvedAlerts} reposiciones completadas`}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-dark-400 mb-2">
            Alertas Pendientes
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">
            {pendingAlerts}
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-500 mt-1">
            {pendingAlerts === 1 ? '1 por resolver' : `${pendingAlerts} por resolver`}
          </p>
        </div>
      </div>

      {/* Actividad por Hora */}
      <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600/50 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Actividad por Hora
        </h2>

        {Object.keys(salesByHour).length > 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 24 }, (_, i) => i)
              .filter(hour => salesByHour[hour])
              .map(hour => (
                <div key={hour} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-300 w-20">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-8">
                    <div
                      className="bg-orange-500 h-8 rounded-full flex items-center justify-end px-3"
                      style={{
                        width: `${Math.min((salesByHour[hour] / Math.max(...Object.values(salesByHour))) * 100, 100)}%`
                      }}
                    >
                      <span className="text-sm font-bold text-white">
                        {salesByHour[hour]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-dark-400">
              No hay actividad registrada hoy
            </p>
          </div>
        )}
      </div>

      {/* Últimas Ventas */}
      <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600/50 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Últimas Ventas
        </h2>

        {sales.length > 0 ? (
          <div className="space-y-2">
            {sales.slice(0, 10).map((sale) => (
              <div
                key={sale.id}
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700/50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {sale.recipe_name} {sale.size ? `(${sale.size})` : ''}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-dark-400">
                    {new Date(sale.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  ×{sale.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-dark-400">
              No hay ventas registradas hoy
            </p>
          </div>
        )}
      </div>

      {/* Historial de Alertas */}
      <div className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600/50 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Historial de Alertas
        </h2>

        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-dark-900/50 border border-gray-200 dark:border-dark-700/50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {alert.ingredient_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-dark-400">
                    Nivel: {alert.current_percentage}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-500">
                    {new Date(alert.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  alert.resolved
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {alert.resolved ? 'Resuelta' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-dark-400">
              No hay alertas registradas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
