import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedBranch } from '../store/authSlice';
import { SkeletonCard } from '../components/Skeleton';
import api from '../services/api';
import { Kiosk, Branch } from '../types';

export default function Dashboard() {
  const { user, selectedBranch } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0 });
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [timeOfDaySales, setTimeOfDaySales] = useState({ morning: 0, midday: 0, afternoon: 0 });

  const isAdmin = user?.role === 'ADMIN';
  const isEmpleado = user?.role === 'EMPLEADO';

  useEffect(() => {
    loadData();
  }, []);

  // Auto-select branch for empleado
  useEffect(() => {
    if (isEmpleado && !selectedBranch && kiosk?.branches && user?.branchId) {
      const b = kiosk.branches.find((br) => br.id === user.branchId);
      if (b) dispatch(setSelectedBranch(b));
    }
  }, [kiosk, isEmpleado, selectedBranch, user?.branchId, dispatch]);

  const loadBranchStats = async (branchId: number) => {
    try {
      const [salesRes, stockRes] = await Promise.all([
        api.get(`/sales/branch/${branchId}`),
        api.get(`/branches/${branchId}/stock`)
      ]);

      const salesData = salesRes.data || [];
      const stockData = stockRes.data || [];

      // Calculate out of stock count
      const zeroStock = stockData.filter((item: any) => item.quantity <= 0).length;
      setOutOfStockCount(zeroStock);

      // Filter sales from today
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySales = salesData.filter((s: any) => s.createdAt.startsWith(todayStr));
      const totalToday = todaySales.reduce((acc: number, s: any) => acc + s.total, 0);
      setTodaySalesTotal(totalToday);

      // Distribute sales by time of day
      let morningSum = 0;
      let middaySum = 0;
      let afternoonSum = 0;

      todaySales.forEach((s: any) => {
        const date = new Date(s.createdAt);
        const hour = date.getHours();
        if (hour >= 6 && hour < 12) {
          morningSum += s.total;
        } else if (hour >= 12 && hour < 16) {
          middaySum += s.total;
        } else if (hour >= 16 && hour < 24) {
          afternoonSum += s.total;
        }
      });

      setTimeOfDaySales({ morning: morningSum, midday: middaySum, afternoon: afternoonSum });
    } catch (err) {
      console.error('Error loading branch stats:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let currentKiosk: Kiosk | null = null;
      if (isAdmin) {
        const { data } = await api.get('/auth/my-kiosk');
        currentKiosk = data;
        setKiosk(data);
      } else if (isEmpleado && user?.branchId) {
        const { data } = await api.get('/auth/my-branch');
        currentKiosk = {
          id: data.kiosk.id,
          name: data.kiosk.name,
          ownerId: 0,
          address: '',
          city: '',
          postalCode: '',
          province: '',
          lat: 0,
          lng: 0,
          createdAt: '',
          branches: [data],
        };
        setKiosk(currentKiosk);
      }

      const [prodRes] = await Promise.all([api.get('/products')]);
      setStats({ totalProducts: prodRes.data.length, totalSales: 0 });

      // Determine active branch for stats
      const activeBranch = selectedBranch || (isEmpleado && currentKiosk?.branches ? currentKiosk.branches.find(b => b.id === user?.branchId) : null);
      
      if (activeBranch) {
        await loadBranchStats(activeBranch.id);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const activeBranch = selectedBranch || (isEmpleado && kiosk?.branches ? kiosk.branches.find(b => b.id === user?.branchId) : null);
    if (activeBranch) {
      loadBranchStats(activeBranch.id);
    } else {
      setTodaySalesTotal(0);
      setOutOfStockCount(0);
      setTimeOfDaySales({ morning: 0, midday: 0, afternoon: 0 });
    }
  }, [selectedBranch, kiosk, isEmpleado, user?.branchId]);

  const selectBranch = (branch: Branch) => {
    dispatch(setSelectedBranch(branch));
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const branches = kiosk?.branches || [];
  const needsBranchSelection = (isAdmin || isEmpleado) && !selectedBranch && branches.length > 0;

  // Branch selector screen (Admin lands here and must pick a branch)
  if (needsBranchSelection && isAdmin) {
    return (
      <div className="flex flex-col gap-4 h-full max-w-4xl mx-auto py-4 px-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 p-6 text-white animate-fade-in-up">
          <div className="relative z-10">
            <p className="text-primary-300 text-xs font-medium mb-1">
              {greeting()}, {user?.name}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">Seleccioná una sucursal</h1>
            <p className="text-surface-400 mt-1 text-xs">
              Elegí la sucursal con la que querés trabajar hoy.
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b, i) => (
              <button
                key={b.id}
                onClick={() => selectBranch(b)}
                className={`text-left rounded-2xl bg-white p-5 border border-surface-200 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 group cursor-pointer animate-fade-in-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg group-hover:scale-110 transition-transform">📍</span>
                  <h3 className="font-bold text-surface-900 group-hover:text-primary-700 transition-colors">
                    {b.name}
                  </h3>
                </div>
                <p className="text-xs text-surface-500 font-medium">{b.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 max-w-4xl mx-auto py-4 px-2">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 px-6 py-5 text-white animate-fade-in-up">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-primary-300 text-xs font-medium">{greeting()}</p>
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight">{user?.name} 👋</h1>
            <p className="text-surface-400 text-xs mt-1">
              {selectedBranch ? `Trabajando en: ${selectedBranch.name}` : 'Resumen de tu red de kioscos.'}
            </p>
          </div>
          {selectedBranch && isAdmin && (
            <button
              onClick={() => dispatch(setSelectedBranch(null))}
              className="text-xs text-primary-300 hover:text-white transition-colors underline shrink-0 cursor-pointer"
            >
              Cambiar sucursal
            </button>
          )}
        </div>
      </div>

      {/* Stats compact row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : [
              { label: 'Sucursales', value: branches.length, icon: '📍' },
              { label: 'Productos', value: stats.totalProducts, icon: '📦' },
              { label: 'Ventas Hoy', value: stats.totalSales, icon: '💰' },
              { label: 'Rol', value: user?.role || '', icon: '👤' },
            ].map((c, i) => (
              <div
                key={c.label}
                className="rounded-2xl bg-white px-4 py-3 border border-surface-200/60 hover:shadow-md transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-surface-50 p-1.5 rounded-xl">{c.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                      {c.label}
                    </p>
                    <p className="text-lg font-extrabold text-surface-900 leading-tight mt-0.5">
                      {c.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Admin: No kiosk placeholder CTA */}
      {isAdmin && !kiosk && !loading && (
        <div className="rounded-2xl bg-white p-8 border border-surface-200/60 shadow-sm text-center max-w-md mx-auto my-8 space-y-4 animate-fade-in-up">
          <span className="text-5xl block animate-float">🏪</span>
          <h2 className="text-lg font-bold text-surface-900">Registrá tu kiosco para comenzar</h2>
          <p className="text-xs text-surface-500 leading-relaxed">
            Como administrador, necesitás registrar tu marca principal de kiosco para poder configurar sucursales, ver métricas de negocio y habilitar a tus empleados.
          </p>
          <button
            onClick={() => navigate('/my-kiosk')}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer inline-block"
          >
            Ir a Mi Kiosco
          </button>
        </div>
      )}

      {/* Active branch view */}
      {selectedBranch && (
        <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider text-surface-400">
              📍 Sucursal Activa
            </h2>
            {isAdmin && (
              <button
                onClick={() => dispatch(setSelectedBranch(null))}
                className="text-xs text-primary-600 font-bold hover:text-primary-700 transition-colors cursor-pointer"
              >
                Cambiar de Sucursal
              </button>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-surface-900">{selectedBranch.name}</p>
            <p className="text-sm text-surface-500 font-medium">{selectedBranch.address}</p>
          </div>
        </div>
      )}

      {/* Cliente view */}
      {user?.role === 'CLIENTE' && (
        <div className="text-center py-10 bg-white rounded-2xl border border-surface-200/60 shadow-sm space-y-4 animate-fade-in-up">
          <span className="text-5xl block animate-float">🗺️</span>
          <h2 className="text-base font-bold text-surface-900">Explorá kioscos cerca tuyo</h2>
          <p className="text-xs text-surface-500 max-w-sm mx-auto">
            Utilizá el mapa interactivo de KioskStar para buscar productos y encontrar los kioscos más cercanos.
          </p>
          <button
            onClick={() => navigate('/map')}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer inline-block"
          >
            Ver Mapa
          </button>
        </div>
      )}
    </div>
  );
}
