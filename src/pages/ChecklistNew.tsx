import { useState } from 'react';
import { Clock, Check } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

export default function ChecklistNew() {
  const [turno, setTurno] = useState<'AM' | 'PM'>('AM');
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      title: 'Apertura',
      items: [
        { id: 'ap1', text: 'Encender todos los equipos (hornos, refrigeradores)', completed: true },
        { id: 'ap2', text: 'Verificar temperatura de refrigeradores y congeladores', completed: true },
        { id: 'ap3', text: 'Revisar inventario de ingredientes críticos', completed: true },
        { id: 'ap4', text: 'Preparar estaciones de trabajo', completed: true },
      ],
    },
    {
      title: 'Preparación',
      items: [
        { id: 'pr1', text: 'Preparar masas del día', completed: true },
        { id: 'pr2', text: 'Cortar vegetales frescos', completed: true },
        { id: 'pr3', text: 'Preparar salsas', completed: true },
        { id: 'pr4', text: 'Organizar ingredientes en estaciones', completed: true },
        { id: 'pr5', text: 'Preparar quesos (rallar, porcionar)', completed: true },
        { id: 'pr6', text: 'Preparar carnes y embutidos', completed: true },
        { id: 'pr7', text: 'Verificar stock de cajas y empaques', completed: true },
        { id: 'pr8', text: 'Preparar ingredientes especiales del día', completed: true },
      ],
    },
    {
      title: 'Limpieza',
      items: [
        { id: 'li1', text: 'Limpiar y desinfectar superficies de trabajo', completed: true },
        { id: 'li2', text: 'Limpiar equipos de cocina', completed: true },
        { id: 'li3', text: 'Barrer y trapear pisos', completed: true },
        { id: 'li4', text: 'Sacar basura', completed: true },
      ],
    },
    {
      title: 'Seguridad e Higiene',
      items: [
        { id: 'sh1', text: 'Verificar fecha de vencimiento de productos', completed: true },
        { id: 'sh2', text: 'Lavar y desinfectar contenedores de ingredientes', completed: true },
        { id: 'sh3', text: 'Revisar que todo el personal tenga uniforme limpio', completed: true },
        { id: 'sh4', text: 'Verificar botiquín de primeros auxilios', completed: true },
      ],
    },
    {
      title: 'Organización',
      items: [
        { id: 'or1', text: 'Revisar stock de bebidas', completed: true },
        { id: 'or2', text: 'Verificar suministros de limpieza', completed: true },
      ],
    },
  ]);

  const toggleItem = (sectionIndex: number, itemId: string) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx === sectionIndex) {
          return {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            ),
          };
        }
        return section;
      })
    );
  };

  const totalTasks = sections.reduce((sum, section) => sum + section.items.length, 0);
  const completedTasks = sections.reduce(
    (sum, section) => sum + section.items.filter((item) => item.completed).length,
    0
  );
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  const allCompleted = completedTasks === totalTasks;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-dark-900/90 dark:bg-dark-800/90 border border-gray-700/50 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-600/20 p-2 rounded-lg">
                <Check className="w-6 h-6 text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Checklist</h1>
            </div>
            <p className="text-gray-400">Protocolo de cocina - Pizzería Di Lauvice</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-orange-400 mb-1">
              {completedTasks}/{totalTasks}
            </div>
            <div className="text-sm text-gray-400">Tareas completadas</div>
          </div>
        </div>

        {/* Turno Selector */}
        <div className="bg-orange-900/30 border border-orange-600/30 rounded-lg p-4 mb-4 flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          <span className="text-orange-400 font-semibold">Turno {turno}</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-600 via-yellow-500 to-green-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-center text-white font-semibold mt-2">
            {progressPercentage}% completado
          </div>
        </div>

        {/* Firmar Button */}
        {allCompleted && (
          <button className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            Firmar Checklist Completado
          </button>
        )}
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => {
          const sectionCompleted = section.items.filter((item) => item.completed).length;
          const sectionTotal = section.items.length;
          const sectionProgress = Math.round((sectionCompleted / sectionTotal) * 100);

          return (
            <div
              key={section.title}
              className="bg-dark-900/80 dark:bg-dark-800/80 border border-gray-700/50 rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-orange-400">{section.title}</h2>
                <span className="text-white font-semibold">
                  {sectionCompleted}/{sectionTotal}
                </span>
              </div>

              {/* Section Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-600 transition-all duration-300"
                  style={{ width: `${sectionProgress}%` }}
                />
              </div>

              {/* Items */}
              <div className="space-y-3">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(sectionIndex, item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      item.completed
                        ? 'bg-green-900/20 border-green-600/30 text-gray-400'
                        : 'bg-dark-800/50 border-gray-700/50 text-white hover:border-orange-500/50'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-600'
                      }`}
                    >
                      {item.completed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span
                      className={`text-left flex-1 ${
                        item.completed ? 'line-through' : ''
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
