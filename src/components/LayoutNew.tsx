import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Pizza,
  Package,
  ShoppingBag,
  CheckSquare,
  LogOut,
  Users
} from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { path: '/pizzas', icon: Pizza, label: 'Pizzas' },
  { path: '/inventario', icon: Package, label: 'Inventario Real' },
  { path: '/lista-compras', icon: ShoppingBag, label: 'Lista Compras' },
  { path: '/checklist', icon: CheckSquare, label: 'Checklist' },
];

export default function LayoutNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-200">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-white">Sistema de</span>{' '}
              <span className="text-orange-500">Mise en Place</span>
            </h1>
            <p className="text-sm text-dark-400 mt-1">
              Control de inventario y ventas en tiempo real
              {user && (
                <span className="ml-3">
                  • <span className="text-dark-300">{user.name}</span>
                  {user.role === 'chef' && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-900 text-orange-300 text-xs rounded">
                      Admin
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
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
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-dark-400 hover:text-dark-200'
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
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
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
    </div>
  );
}
