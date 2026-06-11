import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout } from '../store/authSlice';

const navItems = [
  { to: '/sales', label: 'Ventas', icon: '💰', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/products', label: 'Productos', icon: '📦', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/stock', label: 'Stock', icon: '🏪', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/map', label: 'Mapa', icon: '🗺️', roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'] },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, selectedBranch } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="h-screen flex flex-col bg-surface-50 overflow-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-200/50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Logo and Selected Branch */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-primary-500/20 animate-glow">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-surface-950">
                Kiosk<span className="text-primary-600">Star</span>
              </h1>
            </div>
          </div>
          {selectedBranch && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 text-xs font-semibold text-surface-600 border border-surface-200/40">
              <span className="truncate max-w-[150px]">{selectedBranch.name}</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2" role="navigation">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm transition-all duration-300 hover:-translate-y-[0.5px]
                ${isActive
                  ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
                  : 'font-medium text-surface-500 hover:text-primary-600'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Section: User Info dropdown */}
        <div className="flex items-center gap-4">
          {/* User profile dropdown (Desktop) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-100/60 hover:bg-surface-100 border border-surface-200/40 transition-colors text-left outline-none cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-800 line-clamp-1 max-w-[100px]">{user?.name}</p>
                <p className="text-[9px] text-surface-400 font-medium capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
              </div>
            </button>

            {profileDropdownOpen && (
              <>
                {/* Click outside backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-surface-200 shadow-xl py-1.5 z-20 animate-scale-in">
                  <button
                    onClick={() => { navigate('/dashboard'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors flex items-center gap-2"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { navigate('/dashboard'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors flex items-center gap-2"
                  >
                    Mi Kiosco
                  </button>
                  
                  <div className="border-t border-surface-150 my-1" />
                  
                  <button
                    onClick={() => { navigate('/account'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors flex items-center gap-2"
                  >
                    Cuenta
                  </button>

                  <div className="border-t border-surface-150 my-1" />

                  <button
                    onClick={() => { handleLogout(); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Salir
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors"
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5 text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-md border-b border-surface-200/80 shadow-lg z-30 py-4 px-6 flex flex-col gap-2.5 animate-fade-in-up">
          {/* Quick Access Submenu */}
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `text-sm transition-all duration-300 py-1.5 block
              ${isActive
                ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
                : 'font-medium text-surface-500'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-surface-500 py-1.5 block transition-colors text-left"
          >
            Mi Kiosco
          </NavLink>
          <button
            onClick={() => { navigate('/account'); setMobileMenuOpen(false); }}
            className="text-sm font-medium text-surface-500 py-1.5 block text-left w-full transition-colors"
          >
            Cuenta
          </button>

          <div className="border-t border-surface-150 my-1.5" />

          {/* Filtered Navigation */}
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm transition-all duration-300 py-1.5 block
                ${isActive
                  ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
                  : 'font-medium text-surface-500'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          
          <div className="border-t border-surface-100 my-2 pt-2 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-surface-700">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* Main content page viewport */}
      <main className="flex-1 p-4 lg:p-6 w-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
