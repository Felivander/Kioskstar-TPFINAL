import { useEffect, useState } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { fetchKiosks } from '../store/kioskSlice';
import { SkeletonCard } from '../components/Skeleton';
import api from '../services/api';

interface DashboardStats {
  totalKiosks: number;
  totalBranches: number;
  totalProducts: number;
  totalSales: number;
}

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { kiosks, loading: kiosksLoading } = useAppSelector((state) => state.kiosks);
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<DashboardStats>({ totalKiosks: 0, totalBranches: 0, totalProducts: 0, totalSales: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchKiosks());
    loadStats();
  }, [dispatch]);

  const loadStats = async () => {
    try {
      const [productsRes, kiosksRes] = await Promise.all([
        api.get('/products'),
        api.get('/kiosks'),
      ]);
      setStats({
        totalKiosks: kiosksRes.data.length,
        totalBranches: kiosksRes.data.reduce((acc: number, k: any) => acc + (k.branches?.length || 0), 0),
        totalProducts: productsRes.data.length,
        totalSales: 0,
      });
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  };

  const statCards = [
    { label: 'Kioscos', value: stats.totalKiosks, icon: '🏪', gradient: 'from-princeton-orange-500 to-autumn-leaf-500', shadow: 'shadow-princeton-orange-500/20' },
    { label: 'Sucursales', value: stats.totalBranches, icon: '📍', gradient: 'from-muted-teal-500 to-muted-teal-600', shadow: 'shadow-muted-teal-500/20' },
    { label: 'Productos', value: stats.totalProducts, icon: '📦', gradient: 'from-autumn-leaf-400 to-autumn-leaf-600', shadow: 'shadow-autumn-leaf-500/20' },
    { label: 'Ventas Hoy', value: stats.totalSales, icon: '💰', gradient: 'from-parchment-500 to-parchment-700', shadow: 'shadow-parchment-500/20' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 p-8 lg:p-10 text-white animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-accent-500/8 rounded-full blur-2xl" />
        <div className="relative z-10">
          <p className="text-primary-300 text-sm font-medium mb-1">{greeting()}</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            {user?.name} 👋
          </h1>
          <p className="text-surface-400 mt-2 text-sm max-w-md">
            Resumen de tu red de kioscos. Gestioná stock, productos y ventas desde un solo lugar.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, i) => (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-2xl bg-white p-5 lg:p-6 border border-surface-100 hover:border-surface-200 hover:shadow-lg ${card.shadow} transition-all duration-300 group animate-fade-in-up delay-${i + 1}`}
              >
                <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${card.gradient} opacity-[0.08] group-hover:opacity-[0.15] group-hover:scale-125 transition-all duration-500`} />
                <span className="text-2xl lg:text-3xl block mb-3 group-hover:scale-110 transition-transform duration-300">{card.icon}</span>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl lg:text-3xl font-extrabold text-surface-900 mt-1 tracking-tight">{card.value}</p>
              </div>
            ))
        }
      </div>

      {/* Kiosks section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-surface-900">Kioscos Recientes</h2>
          <span className="text-xs text-surface-400 font-medium">{kiosks.length} total</span>
        </div>

        {kiosksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : kiosks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-surface-100 border-dashed">
            <span className="text-5xl block mb-3 animate-float">🏪</span>
            <p className="text-surface-500 font-medium">No hay kioscos registrados aún</p>
            <p className="text-surface-400 text-sm mt-1">Creá tu primer kiosco para empezar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kiosks.slice(0, 6).map((kiosk, i) => (
              <div
                key={kiosk.id}
                className={`group rounded-2xl bg-white p-5 border border-surface-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 animate-fade-in-up delay-${Math.min(i + 1, 5)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-surface-900 group-hover:text-primary-700 transition-colors">{kiosk.name}</h3>
                  <span className="text-[10px] bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase">
                    {kiosk.branches?.length || 0} suc.
                  </span>
                </div>
                <p className="text-sm text-surface-500 flex items-center gap-1.5">
                  <span className="text-xs">📍</span> {kiosk.address}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
