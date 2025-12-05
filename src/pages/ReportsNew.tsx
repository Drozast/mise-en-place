import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Download, ShoppingBag, FileSpreadsheet } from 'lucide-react';
import { getSocket } from '../lib/socket';
import * as XLSX from 'xlsx';

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

  const handleExportToExcel = () => {
    // Group items by supplier
    const groupedBySupplier: { [key: string]: any[] } = {};

    shoppingList.forEach(item => {
      const supplierName = item.supplier_name || 'Sin Proveedor';
      if (!groupedBySupplier[supplierName]) {
        groupedBySupplier[supplierName] = [];
      }
      groupedBySupplier[supplierName].push(item);
    });

    // Create workbook with one sheet per supplier
    const wb = XLSX.utils.book_new();

    Object.entries(groupedBySupplier).forEach(([supplierName, items]) => {
      const data = items.map(item => ({
        'Ingrediente': item.name,
        'Categoría': item.category,
        'Unidad': item.unit,
        'Stock Actual (%)': item.current_percentage,
        'Cantidad Actual': item.current_quantity,
        'Cantidad Máxima': item.total_quantity,
        'Cantidad Necesaria': Math.ceil((item.total_quantity || 0) - (item.current_quantity || 0)),
        'Prioridad': item.priority === 'high' ? 'URGENTE' : 'Medio',
        'Umbral Crítico': item.critical_threshold,
        'Umbral Advertencia': item.warning_threshold
      }));

      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Ingrediente
        { wch: 15 }, // Categoría
        { wch: 10 }, // Unidad
        { wch: 15 }, // Stock Actual
        { wch: 15 }, // Cantidad Actual
        { wch: 15 }, // Cantidad Máxima
        { wch: 18 }, // Cantidad Necesaria
        { wch: 12 }, // Prioridad
        { wch: 15 }, // Umbral Crítico
        { wch: 18 }  // Umbral Advertencia
      ];

      // Sanitize sheet name (Excel doesn't allow certain characters)
      const sheetName = supplierName.substring(0, 31).replace(/[:\\/?*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Lista_Compras_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const handleWhatsAppSupplier = (supplierName: string, whatsapp: string, items: any[]) => {
    if (!whatsapp) {
      alert(`El proveedor ${supplierName} no tiene WhatsApp registrado`);
      return;
    }

    // Build WhatsApp message
    let message = `Hola! Necesitamos comprar los siguientes ingredientes:\n\n`;
    items.forEach(item => {
      const neededQty = Math.ceil((item.total_quantity || 0) - (item.current_quantity || 0));
      message += `• ${item.name}: ${neededQty} ${item.unit}`;
      if (item.priority === 'high') {
        message += ` (URGENTE)`;
      }
      message += `\n`;
    });
    message += `\n¡Gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  // Group shopping list by supplier
  const groupedShoppingList = shoppingList.reduce((acc: any, item: any) => {
    const supplierName = item.supplier_name || 'Sin Proveedor';
    if (!acc[supplierName]) {
      acc[supplierName] = {
        supplier_name: supplierName,
        supplier_whatsapp: item.supplier_whatsapp,
        items: []
      };
    }
    acc[supplierName].items.push(item);
    return acc;
  }, {});

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
          <div className="flex gap-2">
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handlePrintShoppingList}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {shoppingList.length > 0 ? (
          <div className="space-y-6">
            {Object.values(groupedShoppingList).map((group: any) => (
              <div key={group.supplier_name} className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Supplier Header */}
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b border-gray-300">
                  <div>
                    <h3 className="font-bold text-gray-900">{group.supplier_name}</h3>
                    {group.supplier_whatsapp && (
                      <p className="text-sm text-gray-600">WhatsApp: {group.supplier_whatsapp}</p>
                    )}
                  </div>
                  {group.supplier_whatsapp && (
                    <button
                      onClick={() => handleWhatsAppSupplier(group.supplier_name, group.supplier_whatsapp, group.items)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Enviar
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="p-4 space-y-3">
                  {group.items.map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        item.priority === 'high'
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-700 mt-1">
                            Categoría: {item.category} • Unidad: {item.unit}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            Stock actual: {item.current_percentage}% ({item.current_quantity || 0} {item.unit})
                          </p>
                          <p className="text-sm text-gray-700">
                            Necesario: ~{Math.ceil((item.total_quantity || 0) - (item.current_quantity || 0))} {item.unit}
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
