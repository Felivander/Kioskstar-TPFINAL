# Hybrid Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the KioskStar dashboard into a hybrid operational and analytical view that is centered, compact, and extremely easy to use.

**Architecture:** We will update the React dashboard page to fetch sales and stock metrics dynamically from existing endpoints (`/api/sales/branch/:id` and `/api/branches/:id/stock`), processing the statistics in the frontend. We will display a centered layout with quick action buttons, a metrics grid, and a compact SVG bar chart.

**Tech Stack:** React 19, TypeScript 6, TailwindCSS 4, Axios, Redux Toolkit.

---

### Task 1: Update Dashboard Component State and Load Logic

**Files:**
- Modify: [Dashboard.tsx](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/pages/Dashboard.tsx)

- [ ] **Step 1: Update imports and state hooks**

Open `frontend/src/pages/Dashboard.tsx`. Update the top imports to ensure all required elements are present. Add state variables for `todaySalesTotal`, `outOfStockCount`, and `timeOfDaySales` inside the `Dashboard` component:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedBranch } from '../store/authSlice';
import { SkeletonCard } from '../components/Skeleton';
import api from '../services/api';
import { Kiosk, Branch } from '../types';

// Inside Dashboard component (line 15):
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [timeOfDaySales, setTimeOfDaySales] = useState({ morning: 0, midday: 0, afternoon: 0 });
```

- [ ] **Step 2: Update the `loadData` function to fetch sales and stock metrics**

Modify `loadData` inside `Dashboard.tsx` to conditionally load branch stats when a branch is selected:

```tsx
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
```

- [ ] **Step 3: Add `loadBranchStats` helper function**

Add the helper function inside the `Dashboard` component to fetch and process sales and stock data:

```tsx
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
```

- [ ] **Step 4: Add effect hook to reload branch statistics when selected branch changes**

Add a `useEffect` hook to trigger `loadBranchStats` whenever the active `selectedBranch` changes:

```tsx
  useEffect(() => {
    if (selectedBranch) {
      loadBranchStats(selectedBranch.id);
    } else {
      setTodaySalesTotal(0);
      setOutOfStockCount(0);
      setTimeOfDaySales({ morning: 0, midday: 0, afternoon: 0 });
    }
  }, [selectedBranch]);
```

- [ ] **Step 5: Commit changes**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add stats loading logic to dashboard page"
```

---

### Task 2: Implement Redesigned Hybrid Dashboard UI Layout

**Files:**
- Modify: [Dashboard.tsx](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/pages/Dashboard.tsx)

- [ ] **Step 1: Replace the main return block of the Dashboard component**

Replace the entire main return block starting from line 123 to 235 with the new centered hybrid layout (`max-w-3xl mx-auto px-4 py-6`):

```tsx
  return (
    <div className="flex flex-col gap-5 h-full min-h-0 max-w-3xl mx-auto py-6 px-4 animate-fade-in-up">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 px-6 py-5 text-white shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-primary-300 text-xs font-semibold uppercase tracking-wider">{greeting()}</p>
              <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full font-bold uppercase">{user?.role}</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight mt-1">{user?.name} 👋</h1>
            <p className="text-surface-400 text-xs mt-1.5 font-medium">
              {selectedBranch ? `Sucursal: ${selectedBranch.name}` : 'Resumen de tu red de kioscos.'}
            </p>
          </div>
          {selectedBranch && isAdmin && (
            <button
              onClick={() => dispatch(setSelectedBranch(null))}
              className="text-xs font-bold text-primary-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-sm"
            >
              Cambiar sucursal
            </button>
          )}
        </div>
      </div>

      {/* Admin: No kiosk placeholder CTA */}
      {isAdmin && !kiosk && !loading && (
        <div className="rounded-2xl bg-white p-8 border border-surface-200/60 shadow-sm text-center max-w-md mx-auto my-6 space-y-4">
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

      {/* Quick Actions (Foolproof buttons) */}
      {(selectedBranch || isEmpleado) && (
        <div className="space-y-2.5">
          <h2 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-1">
            ⚡ Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/sales')}
              className="flex flex-col items-center gap-2.5 bg-white border border-surface-200/60 hover:border-primary-400 p-4 rounded-2xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💰</span>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-surface-900">Registrar Venta</span>
                <span className="text-[9px] text-surface-400 font-medium">Escanear o Manual</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/stock')}
              className="flex flex-col items-center gap-2.5 bg-white border border-surface-200/60 hover:border-primary-400 p-4 rounded-2xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-surface-900">Cargar Stock</span>
                <span className="text-[9px] text-surface-400 font-medium">Actualizar cantidades</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/map')}
              className="flex flex-col items-center gap-2.5 bg-white border border-surface-200/60 hover:border-primary-400 p-4 rounded-2xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🗺️</span>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-surface-900">Ver Mapa</span>
                <span className="text-[9px] text-surface-400 font-medium">Buscador y Kioscos</span>
              </div>
            </button>

            <button
              onClick={() => navigate(isAdmin ? '/my-kiosk' : '/dashboard')}
              className="flex flex-col items-center gap-2.5 bg-white border border-surface-200/60 hover:border-primary-400 p-4 rounded-2xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-surface-900">{isAdmin ? 'Personal' : 'Mi Cuenta'}</span>
                <span className="text-[9px] text-surface-400 font-medium">{isAdmin ? 'Invitaciones' : 'Detalles de perfil'}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Metrics and Visual Analytics Section */}
      {(selectedBranch || isEmpleado) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* KPI Widget Cards */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-1">
              📊 Métricas de hoy
            </h2>
            
            {/* Sales revenue */}
            <div className="bg-white border border-surface-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold">
                $
              </div>
              <div>
                <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Ventas totales (Hoy)</p>
                <p className="text-base font-extrabold text-surface-950 mt-0.5">${todaySalesTotal.toLocaleString('es-AR')}</p>
              </div>
            </div>

            {/* Out of Stock alert */}
            <div className={`border rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-colors duration-200
              ${outOfStockCount > 0 
                ? 'bg-red-50/50 border-red-200 text-red-950' 
                : 'bg-white border-surface-200/60 text-surface-950'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                ${outOfStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-surface-50 text-surface-600'}`}
              >
                🚨
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${outOfStockCount > 0 ? 'text-red-500' : 'text-surface-400'}`}>
                  Productos Sin Stock
                </p>
                <p className="text-base font-extrabold mt-0.5">
                  {outOfStockCount} {outOfStockCount === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>
          </div>

          {/* Sales chart Widget (B style) */}
          <div className="bg-white border border-surface-200/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm min-h-[170px]">
            <div>
              <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">📈 Distribución de Ventas</h3>
              <p className="text-[9px] text-surface-400 font-medium mt-0.5">Ingresos acumulados según turno de hoy</p>
            </div>

            {/* SVG Bars container */}
            <div className="flex items-end gap-5 h-20 border-b border-surface-100 pb-1.5 px-3">
              {(() => {
                const maxVal = Math.max(timeOfDaySales.morning, timeOfDaySales.midday, timeOfDaySales.afternoon, 1);
                const morningPct = (timeOfDaySales.morning / maxVal) * 100;
                const middayPct = (timeOfDaySales.midday / maxVal) * 100;
                const afternoonPct = (timeOfDaySales.afternoon / maxVal) * 100;

                return (
                  <>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-indigo-100 hover:bg-indigo-200 rounded-t-md transition-all duration-500" 
                        style={{ height: `${Math.max(morningPct, 5)}%` }}
                        title={`Mañana: $${timeOfDaySales.morning}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary-500 rounded-t-md transition-all duration-500" 
                        style={{ height: `${Math.max(middayPct, 5)}%` }}
                        title={`Mediodía: $${timeOfDaySales.midday}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-indigo-900 rounded-t-md transition-all duration-500" 
                        style={{ height: `${Math.max(afternoonPct, 5)}%` }}
                        title={`Tarde/Noche: $${timeOfDaySales.afternoon}`}
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[9px] text-surface-400 font-semibold px-2">
              <span className="flex flex-col items-center">
                <span>Mañana</span>
                <span className="text-surface-600 font-bold">${timeOfDaySales.morning}</span>
              </span>
              <span className="flex flex-col items-center">
                <span>Mediodía</span>
                <span className="text-primary-600 font-bold">${timeOfDaySales.midday}</span>
              </span>
              <span className="flex flex-col items-center">
                <span>Tarde/Noche</span>
                <span className="text-indigo-950 font-bold">${timeOfDaySales.afternoon}</span>
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Cliente view */}
      {user?.role === 'CLIENTE' && (
        <div className="text-center py-12 bg-white rounded-2xl border border-surface-200/60 shadow-sm space-y-4">
          <span className="text-5xl block animate-float">🗺️</span>
          <h2 className="text-base font-bold text-surface-900">Explorá kioscos cerca tuyo</h2>
          <p className="text-xs text-surface-500 max-w-sm mx-auto leading-relaxed">
            Utilizá el mapa interactivo de KioskStar para buscar productos y encontrar los kioscos más cercanos en Concordia.
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
```

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: redesign dashboard layout with hybrid quick-actions and visual stats"
```

---

### Task 3: Build Verification

**Files:**
- Test: Compile check only

- [ ] **Step 1: Run compilation build to verify changes**

Run frontend build:
`cmd.exe /c "set PATH=%PATH%;C:\\Program Files\\nodejs&& npm run build"` in `frontend/`.
Expected output: successful compilation with zero errors.
