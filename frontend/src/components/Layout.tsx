import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout, setSelectedBranch } from '../store/authSlice';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/sales', label: 'Ventas', icon: '💰', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/products', label: 'Productos', icon: '📦', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/stock', label: 'Stock', icon: '🏪', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/map', label: 'Mapa', icon: '🗺️', roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, selectedBranch } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-surface-950 text-white transform transition-transform duration-300 ease-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        aria-label="Navegación principal"
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg shadow-lg shadow-primary-500/20 animate-glow">
              🌟
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Kiosk<span className="text-primary-300">Star</span>
              </h1>
              <p className="text-[10px] text-surface-500 tracking-wider uppercase">Panel de gestión</p>
            </div>
          </div>
          {selectedBranch && (
            <div className="mt-3 flex items-center gap-2 text-xs text-surface-400">
              <span>📍</span>
              <span className="truncate">{selectedBranch.name}</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-2 px-3 space-y-0.5 overflow-y-auto" role="navigation">
          <p className="text-[10px] uppercase tracking-widest text-surface-600 font-semibold px-4 pt-4 pb-2">Menú</p>
          {filteredNav.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-600/90 text-white shadow-lg shadow-primary-600/20'
                  : 'text-surface-400 hover:bg-white/[0.04] hover:text-surface-200'}`
              }
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="text-base group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/[0.03]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-surface-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-xs text-surface-500 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200 flex items-center gap-2 justify-center"
            aria-label="Cerrar sesión"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-surface-200/50 px-4 lg:px-8 py-3.5 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-surface-100 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5 text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <span className="text-xs text-surface-400 hidden sm:block font-medium">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
