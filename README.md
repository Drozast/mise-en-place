# 🍕 Sistema Mise en Place

Sistema completo de gestión de inventario y ventas en tiempo real para pizzería.

## ✨ Características Principales

### 📊 Dashboard Interactivo
- Métricas en tiempo real de ventas y stock
- Cards clickeables con animaciones
- Vista general del estado operacional

### 📦 Gestión de Inventario
- Control de cantidades reales (no solo porcentajes)
- Unidades de medida configurables (kg, g, L, ml, cc, unidades, piezas)
- Alertas automáticas de stock bajo/crítico
- Organización por categorías

### 🛒 Lista de Compras Automática
- Generación automática basada en umbrales
- Priorización por urgencia (crítico/advertencia)
- Exportación e impresión

### 💰 Registro de Ventas
- Botones rápidos para ventas frecuentes
- Descuento automático de inventario según recetas
- Historial completo de transacciones

### 📋 Sistema de Turnos
- Checklist de tareas por turno (AM/PM)
- Timestamps detallados con tiempo transcurrido
- Sistema de autorización para cierre (Chef/Admin)
- Resumen de inventario al abrir turno

### 👥 Gestión de Usuarios
- Autenticación con RUT chileno
- Roles: Chef/Admin y Empleado
- Permisos diferenciados por rol

### 🍕 Gestión de Recetas
- Configuración de pizzas y tablas
- Ingredientes con cantidades precisas
- Cálculo automático de descuentos

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **better-sqlite3** - Database
- **Socket.io** - Real-time updates

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/USERNAME/mise-en-place.git
cd mise-en-place

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 👤 Usuarios de Prueba

### Chef/Admin
- RUT: `11111111-1`
- Contraseña: `1111`

### Empleado
- RUT: `22222222-2`
- Contraseña: `2222`

## 📁 Estructura del Proyecto

```
mise-en-place/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas principales
│   ├── store/             # Estado global (Zustand)
│   └── lib/               # API client
├── server/                # Backend Node.js
│   ├── routes/            # Endpoints API
│   ├── database/          # Configuración SQLite
│   └── types/             # TypeScript types
├── data/                  # Base de datos SQLite
└── public/                # Archivos estáticos
```

## 🎯 Flujo de Uso Diario

1. **Login** - Autenticación con RUT
2. **Abrir Turno** - Ver resumen de inventario e ingredientes críticos
3. **Completar Checklist** - Tareas del turno con timestamps
4. **Registrar Ventas** - Descuento automático de inventario
5. **Restoquear** - Actualizar ingredientes cuando llegue mercadería
6. **Revisar Lista de Compras** - Generada automáticamente
7. **Cerrar Turno** - Con validación de tareas completadas

## 🔒 Seguridad

- Autenticación basada en RUT chileno
- Contraseñas hasheadas (primeros 4 dígitos del RUT en desarrollo)
- Control de acceso basado en roles
- Protección de rutas en frontend y backend

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo (frontend + backend)
npm run dev:client   # Solo frontend
npm run dev:server   # Solo backend
npm run build        # Build para producción
```

## 🤝 Contribuciones

Este proyecto fue desarrollado como sistema interno para gestión de pizzería.

## 📄 Licencia

MIT

---

🧑‍🍳 **Desarrollado con Claude Code**
