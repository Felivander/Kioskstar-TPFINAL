import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { motion } from 'framer-motion';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout, setSelectedBranch } from '../store/authSlice';
import api from '../services/api';
import { Branch } from '../types';

const navItems = [
  { to: '/sales', label: 'Ventas', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/products', label: 'Productos', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/stock', label: 'Stock', roles: ['ADMIN', 'EMPLEADO'] },
  { to: '/map', label: 'Mapa', roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'] },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { user, selectedBranch } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || ''));
  const currentIndex = filteredNav.findIndex((item) => item.to === currentPath);

  // Navigation pages calculations
  let prevPage = null;
  let nextPage = null;

  if (currentIndex !== -1) {
    prevPage = currentIndex > 0 ? filteredNav[currentIndex - 1] : null;
    nextPage = currentIndex < filteredNav.length - 1 ? filteredNav[currentIndex + 1] : null;
  } else if (currentPath === '/dashboard' && filteredNav.length > 0) {
    nextPage = filteredNav[0];
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/auth/my-kiosk')
        .then(({ data }) => {
          if (data && data.branches) {
            setBranches(data.branches);
          }
        })
        .catch((err) => console.error('Error al cargar sucursales en Layout:', err));
    }
  }, [user]);

  // filteredNav is calculated above for routing and layout

  return (
    <div className="h-screen flex flex-col bg-surface-50 overflow-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-200/50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Logo and Selected Branch */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer select-none">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-primary-500/20 animate-glow">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-surface-950">
                Kiosk<span className="text-primary-600">Star</span>
              </h1>
            </div>
          </Link>
          {selectedBranch && (
            <div className="relative">
              <button
                onClick={() => {
                  if (user?.role === 'ADMIN' && branches.length > 1) {
                    setBranchDropdownOpen(!branchDropdownOpen);
                  }
                }}
                disabled={user?.role !== 'ADMIN' || branches.length <= 1}
                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 rounded-full text-xs font-semibold border border-surface-200/40 bg-surface-100 text-surface-600 transition-all select-none outline-none
                  ${user?.role === 'ADMIN' && branches.length > 1 ? 'cursor-pointer hover:bg-surface-200/60 hover:text-surface-700' : ''}`}
              >
                <span className="truncate max-w-[90px] sm:max-w-[150px]">{selectedBranch.name}</span>
              </button>

              {branchDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setBranchDropdownOpen(false)} />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white border border-surface-200 shadow-xl py-1.5 z-20 animate-scale-in">
                    <p className="px-3 py-1 text-[9px] font-bold text-surface-400 uppercase tracking-wider">Cambiar Sucursal</p>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          dispatch(setSelectedBranch(b));
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer
                          ${selectedBranch.id === b.id
                            ? 'bg-primary-50 text-primary-700 font-bold'
                            : 'text-surface-700 hover:bg-surface-50 hover:text-surface-900'}`}
                      >
                        <span className="truncate">{b.name}</span>
                        {selectedBranch.id === b.id && <span className="text-primary-600">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-2 relative" role="navigation">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative px-4 py-3 text-sm transition-colors duration-300 rounded-md select-none
                ${isActive
                  ? 'font-bold text-white z-10'
                  : 'font-medium text-surface-500 hover:text-primary-600 hover:bg-surface-100'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-tab"
                      className="absolute inset-0 bg-primary-500 rounded-md -z-10 shadow-md shadow-primary-500/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </>
              )}
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
                    onClick={() => { navigate('/my-kiosk'); setProfileDropdownOpen(false); }}
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
              `relative text-sm transition-colors duration-300 px-4 py-3 rounded-md block select-none
              ${isActive
                ? 'font-bold text-white z-10'
                : 'font-medium text-surface-500 hover:bg-surface-50'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-mobile-nav-tab"
                    className="absolute inset-0 bg-primary-500 rounded-md -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                Dashboard
              </>
            )}
          </NavLink>
          <NavLink
            to="/my-kiosk"
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
                `relative text-sm transition-colors duration-300 px-4 py-3 rounded-md block select-none
                ${isActive
                  ? 'font-bold text-white z-10'
                  : 'font-medium text-surface-500 hover:bg-surface-50'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-mobile-nav-tab"
                      className="absolute inset-0 bg-primary-500 rounded-md -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </>
              )}
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

      {/* Main content page viewport with Edge Navigation */}
      <div className="flex-1 flex relative overflow-hidden">
        {prevPage && (
          <button
            onClick={() => navigate(prevPage.to)}
            className="absolute left-0 top-0 bottom-0 w-8 z-30 group cursor-pointer flex items-center justify-start focus:outline-none select-none"
            aria-label={`Ir a ${prevPage.label}`}
            title={`Ir a ${prevPage.label}`}
          >
            {/* Stretching orange vertical handle */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-primary-500 rounded-r-full transition-all duration-300 ease-out group-hover:h-40 group-hover:w-8 group-hover:bg-primary-600 shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center justify-center text-white overflow-hidden group-hover:rounded-r-[40px]">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-black -translate-x-[2px]">‹</span>
            </div>
          </button>
        )}

        {nextPage && (
          <button
            onClick={() => navigate(nextPage.to)}
            className="absolute right-0 top-0 bottom-0 w-8 z-30 group cursor-pointer flex items-center justify-end focus:outline-none select-none"
            aria-label={`Ir a ${nextPage.label}`}
            title={`Ir a ${nextPage.label}`}
          >
            {/* Stretching orange vertical handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-primary-500 rounded-l-full transition-all duration-300 ease-out group-hover:h-40 group-hover:w-8 group-hover:bg-primary-600 shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center justify-center text-white overflow-hidden group-hover:rounded-l-[40px]">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-black translate-x-[2px]">›</span>
            </div>
          </button>
        )}

        <main className="flex-1 p-4 lg:p-6 w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
