import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Pizza,
  Package,
  ShoppingBag,
  CheckSquare,
  LogOut,
  Users,
  Sun,
  Moon,
  Gift
} from 'lucide-react';
import { useStore } from '../store/useStore';
import MotivationalCard from './MotivationalCard';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { path: '/pizzas', icon: Pizza, label: 'Pizzas' },
  { path: '/inventario', icon: Package, label: 'Inventario Real' },
  { path: '/lista-compras', icon: ShoppingBag, label: 'Lista Compras' },
  { path: '/checklist', icon: CheckSquare, label: 'Checklist' },
  { path: '/premios', icon: Gift, label: 'Premios' },
];

export default function LayoutNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-text-secondary dark:text-gray-300 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-border dark:border-gray-800 shadow-sm transition-colors">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-heading">
              <span className="text-text-primary dark:text-white">Sistema de</span>{' '}
              <span className="text-primary dark:text-primary">Mise en Place</span>
            </h1>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              Control de inventario y ventas en tiempo real
              {user && (
                <span className="ml-3">
                  • <span className="text-text-primary dark:text-gray-200">{user.name}</span>
                  {user.role === 'chef' && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-dark text-white text-xs rounded font-heading">
                      Admin
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-primary dark:text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg font-heading"
              title={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg font-heading"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary dark:text-primary'
                      : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Users link (only for chef/admin) */}
            {user?.role === 'chef' && (
              <Link
                to="/usuarios"
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  location.pathname === '/usuarios'
                    ? 'border-primary text-primary dark:text-primary'
                    : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Usuarios</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Outlet />
      </main>

      {/* Motivational Card - Solo para empleados */}
      {user?.role === 'empleado' && <MotivationalCard />}
    </div>
  );
}
