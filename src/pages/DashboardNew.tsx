import { useEffect, useState } from 'react';
import { TrendingUp, Pizza as PizzaIcon, AlertTriangle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function DashboardNew() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVentas: 0,
    masasUsadas: 0,
    masasDisponibles: 20,
    alertasActivas: 0,
    alertasCriticas: 0,
    alertasBajas: 0,
    ingredientesActivos: 0,
  });

  const [ventasPorPizza, setVentasPorPizza] = useState<any[]>([]);
  const [ventasPorTamano, setVentasPorTamano] = useState({
    L: { count: 0, disponibles: 10 },
    M: { count: 0, disponibles: 6 },
    S: { count: 0, disponibles: 4 },
  });
  const [miseEnPlace, setMiseEnPlace] = useState<any[]>([]);
  const [loadingMise, setLoadingMise] = useState(true);

  useEffect(() => {
    loadData();
    loadMiseEnPlace();

    // Refresh mise en place every 10 seconds
    const interval = setInterval(loadMiseEnPlace, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [salesData, alertsData, ingredientsData] = await Promise.all([
        api.sales.getSummary(new Date().toISOString().split('T')[0]),
        api.alerts.getAll(false),
        api.ingredients.getAll(),
      ]);

      const totalVentas = salesData.reduce((sum: number, s: any) => sum + s.total_quantity, 0);
      const alertasCriticas = alertsData.filter((a: any) => a.type === 'critical').length;
      const alertasBajas = alertsData.filter((a: any) => a.type === 'warning').length;

      setStats({
        totalVentas,
        masasUsadas: totalVentas,
        masasDisponibles: 20,
        alertasActivas: alertsData.length,
        alertasCriticas,
        alertasBajas,
        ingredientesActivos: ingredientsData.length,
      });

      setVentasPorPizza(salesData);

      // Simulación de distribución por tamaño
      // En producción, esto vendría de la base de datos
      const masasL = Math.floor(totalVentas * 0.5);
      const masasM = Math.floor(totalVentas * 0.3);
      const masasS = totalVentas - masasL - masasM;

      setVentasPorTamano({
        L: { count: masasL, disponibles: 10 },
        M: { count: masasM, disponibles: 6 },
        S: { count: masasS, disponibles: 4 },
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
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
    } finally {
      setLoadingMise(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'green': return 'Óptimo';
      case 'yellow': return 'Atención';
      case 'orange': return 'Urgente';
      case 'red': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ventas */}
        <div
          onClick={() => navigate('/ventas')}
          className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-dark-400 group-hover:text-orange-400 transition-colors">Total Ventas</div>
            <div className="p-2 bg-gray-100 dark:bg-dark-700 rounded-lg group-hover:bg-orange-500/10 transition-colors">
              <TrendingUp className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalVentas}</div>
          <div className="text-xs text-gray-600 dark:text-dark-400 group-hover:text-gray-700 dark:group-hover:text-dark-300 transition-colors">Pizzas vendidas hoy</div>
        </div>

        {/* Masas Usadas */}
        <div
          onClick={() => navigate('/pizzas')}
          className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-dark-400 group-hover:text-orange-400 transition-colors">Masas Usadas</div>
            <div className="p-2 bg-gray-100 dark:bg-dark-700 rounded-lg group-hover:bg-orange-500/10 transition-colors">
              <PizzaIcon className="w-5 h-5 text-orange-500 group-hover:text-orange-400 transition-colors" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.masasUsadas}/{stats.masasDisponibles}
          </div>
          <div className="text-xs text-gray-600 dark:text-dark-400 group-hover:text-gray-700 dark:group-hover:text-dark-300 transition-colors">
            {Math.round((stats.masasUsadas / stats.masasDisponibles) * 100)}% utilizadas
          </div>
        </div>

        {/* Alertas Activas */}
        <div
          onClick={() => navigate('/lista-compras')}
          className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-dark-400 group-hover:text-orange-400 transition-colors">Alertas Activas</div>
            <div className="p-2 bg-gray-100 dark:bg-dark-700 rounded-lg group-hover:bg-orange-500/10 transition-colors">
              <AlertTriangle className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{stats.alertasActivas}</div>
          <div className="text-xs text-gray-600 dark:text-dark-400 group-hover:text-gray-700 dark:group-hover:text-dark-300 transition-colors">
            {stats.alertasCriticas} críticos, {stats.alertasBajas} bajos
          </div>
        </div>

        {/* Estado Inventario */}
        <div
          onClick={() => navigate('/inventario')}
          className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-dark-400 group-hover:text-orange-400 transition-colors">Estado Inventario</div>
            <div className="p-2 bg-gray-100 dark:bg-dark-700 rounded-lg group-hover:bg-orange-500/10 transition-colors">
              <Package className="w-5 h-5 text-blue-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{stats.ingredientesActivos}</div>
          <div className="text-xs text-gray-600 dark:text-dark-400 group-hover:text-gray-700 dark:group-hover:text-dark-300 transition-colors">Ingredientes activos</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Pizza */}
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ventas por Pizza</h3>
          <div className="space-y-3">
            {ventasPorPizza.length > 0 ? (
              ventasPorPizza.map((pizza, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-100 dark:bg-dark-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{pizza.name}</p>
                    <p className="text-sm text-gray-600 dark:text-dark-400 capitalize">{pizza.type}</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{pizza.total_quantity}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-dark-400">
                No hay ventas registradas
              </div>
            )}
          </div>
        </div>

        {/* Distribución por Tamaño */}
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Tamaño</h3>
          <div className="space-y-4">
            {/* Tamaño L */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white font-semibold">Tamaño L</span>
                  <span className="text-sm text-gray-600 dark:text-dark-400">
                    {ventasPorTamano.L.disponibles} masas disponibles
                  </span>
                </div>
                <span className="text-gray-900 dark:text-white font-bold">{ventasPorTamano.L.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (ventasPorTamano.L.count / ventasPorTamano.L.disponibles) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-right text-xs text-gray-600 dark:text-dark-400 mt-1">
                {Math.round((ventasPorTamano.L.count / ventasPorTamano.L.disponibles) * 100)}%
              </div>
            </div>

            {/* Tamaño M */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white font-semibold">Tamaño M</span>
                  <span className="text-sm text-gray-600 dark:text-dark-400">
                    {ventasPorTamano.M.disponibles} masas disponibles
                  </span>
                </div>
                <span className="text-gray-900 dark:text-white font-bold">{ventasPorTamano.M.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (ventasPorTamano.M.count / ventasPorTamano.M.disponibles) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-right text-xs text-gray-600 dark:text-dark-400 mt-1">
                {Math.round((ventasPorTamano.M.count / ventasPorTamano.M.disponibles) * 100)}%
              </div>
            </div>

            {/* Tamaño S */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white font-semibold">Tamaño S</span>
                  <span className="text-sm text-gray-600 dark:text-dark-400">
                    {ventasPorTamano.S.disponibles} masas disponibles
                  </span>
                </div>
                <span className="text-gray-900 dark:text-white font-bold">{ventasPorTamano.S.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (ventasPorTamano.S.count / ventasPorTamano.S.disponibles) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-right text-xs text-gray-600 dark:text-dark-400 mt-1">
                {Math.round((ventasPorTamano.S.count / ventasPorTamano.S.disponibles) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mise en Place en Tiempo Real */}
      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500" />
          Mise en Place del Turno Actual
          <span className="ml-auto text-xs text-gray-500 dark:text-dark-500">
            Actualización automática cada 10s
          </span>
        </h3>

        {loadingMise ? (
          <div className="text-center py-8 text-gray-500 dark:text-dark-400">
            Cargando mise en place...
          </div>
        ) : miseEnPlace.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-dark-400">
            No hay turno abierto. Abre un turno para ver el mise en place.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {miseEnPlace.map((item: any) => (
              <div
                key={item.id}
                className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4 border-l-4 transition-all hover:scale-102"
                style={{ borderLeftColor: item.status === 'green' ? '#22c55e' : item.status === 'yellow' ? '#eab308' : item.status === 'orange' ? '#f97316' : '#ef4444' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {item.ingredient_name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-dark-400 mt-1">
                      {Math.round(item.current_quantity)} / {Math.round(item.initial_quantity)} {item.unit}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      item.status === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.status === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      item.status === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {getStatusText(item.status)}
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-300 dark:bg-dark-600 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getStatusColor(item.status)}`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
