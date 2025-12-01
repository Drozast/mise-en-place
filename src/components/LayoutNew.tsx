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
    <div className="min-h-screen bg-background text-text-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-heading">
              <span className="text-text-primary">Sistema de</span>{' '}
              <span className="text-primary">Mise en Place</span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Control de inventario y ventas en tiempo real
              {user && (
                <span className="ml-3">
                  • <span className="text-text-primary">{user.name}</span>
                  {user.role === 'chef' && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-dark text-white text-xs rounded font-heading">
                      Admin
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg font-heading"
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
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
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
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
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
