import { useEffect, useState } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedBranch } from '../store/authSlice';
import { SkeletonCard } from '../components/Skeleton';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { Kiosk, Branch } from '../types';

export default function Dashboard() {
  const { user, selectedBranch } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingKiosk, setEditingKiosk] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  // Invite code
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteBranchId, setInviteBranchId] = useState<number | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  // Stats
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0 });

  const isAdmin = user?.role === 'ADMIN';
  const isEmpleado = user?.role === 'EMPLEADO';

  useEffect(() => { loadData(); }, []);

  // Auto-select branch for empleado
  useEffect(() => {
    if (isEmpleado && !selectedBranch && kiosk?.branches && user?.branchId) {
      const b = kiosk.branches.find((br) => br.id === user.branchId);
      if (b) dispatch(setSelectedBranch(b));
    }
  }, [kiosk, isEmpleado, selectedBranch, user?.branchId, dispatch]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const { data } = await api.get('/auth/my-kiosk');
        setKiosk(data);
      } else if (isEmpleado && user?.branchId) {
        const { data } = await api.get('/auth/my-branch');
        setKiosk({ id: data.kiosk.id, name: data.kiosk.name, ownerId: 0, address: '', lat: 0, lng: 0, createdAt: '', branches: [data] });
      }
      const [prodRes] = await Promise.all([api.get('/products')]);
      setStats({ totalProducts: prodRes.data.length, totalSales: 0 });
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleEditKiosk = () => {
    if (!kiosk) return;
    setEditName(kiosk.name);
    setEditAddress(kiosk.address);
    setEditingKiosk(true);
  };

  const saveKiosk = async () => {
    if (!kiosk) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/kiosks/${kiosk.id}`, { name: editName, address: editAddress, lat: kiosk.lat || -34.6, lng: kiosk.lng || -58.38 });
      setKiosk((prev) => prev ? { ...prev, ...data } : data);
      setEditingKiosk(false);
    } catch { /* silent */ }
    setSaving(false);
  };

  const addBranch = async () => {
    if (!kiosk || !branchName.trim() || !branchAddress.trim()) return;
    setSaving(true);
    try {
      await api.post(`/kiosks/${kiosk.id}/branches`, { name: branchName, address: branchAddress, lat: -34.6, lng: -58.38 });
      setBranchName(''); setBranchAddress(''); setShowBranchForm(false);
      await loadData();
    } catch { /* silent */ }
    setSaving(false);
  };

  const generateInvite = async () => {
    if (!kiosk || !inviteBranchId) return;
    setInviteLoading(true);
    try {
      const { data } = await api.post(`/auth/kiosks/${kiosk.id}/invite-code`, { branchId: inviteBranchId });
      setGeneratedCode(data.code);
    } catch { /* silent */ }
    setInviteLoading(false);
  };

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

  // Branch selector modal
  if (needsBranchSelection && isAdmin) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 p-8 text-white animate-fade-in-up">
          <div className="relative z-10">
            <p className="text-primary-300 text-sm font-medium mb-1">{greeting()}, {user?.name}</p>
            <h1 className="text-3xl font-extrabold tracking-tight">Seleccioná una sucursal</h1>
            <p className="text-surface-400 mt-2 text-sm">Elegí la sucursal con la que querés trabajar hoy</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b, i) => (
              <button key={b.id} onClick={() => selectBranch(b)}
                className={`text-left rounded-2xl bg-white p-6 border-2 border-surface-100 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 group animate-fade-in-up delay-${i + 1}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📍</span>
                  <h3 className="font-bold text-surface-900 text-lg group-hover:text-primary-700 transition-colors">{b.name}</h3>
                </div>
                <p className="text-sm text-surface-500">{b.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 p-8 lg:p-10 text-white animate-fade-in-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-primary-300 text-sm font-medium mb-1">{greeting()}</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{user?.name} 👋</h1>
          <p className="text-surface-400 mt-2 text-sm max-w-md">
            {selectedBranch ? `Trabajando en: ${selectedBranch.name}` : 'Resumen de tu red de kioscos.'}
          </p>
          {selectedBranch && isAdmin && (
            <button onClick={() => dispatch(setSelectedBranch(null))} className="mt-3 text-xs text-primary-300 hover:text-white transition-colors underline">
              Cambiar sucursal
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : [
          { label: 'Sucursales', value: branches.length, icon: '📍' },
          { label: 'Productos', value: stats.totalProducts, icon: '📦' },
          { label: 'Ventas Hoy', value: stats.totalSales, icon: '💰' },
          { label: 'Rol', value: user?.role || '', icon: '👤' },
        ].map((c, i) => (
          <div key={c.label} className={`rounded-2xl bg-white p-5 border border-surface-100 hover:shadow-lg transition-all animate-fade-in-up delay-${i + 1}`}>
            <span className="text-2xl block mb-3">{c.icon}</span>
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">{c.label}</p>
            <p className="text-2xl font-extrabold text-surface-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Admin: Kiosk management */}
      {isAdmin && kiosk && (
        <div className="space-y-6">
          {/* Kiosk info/edit */}
          <div className="rounded-2xl bg-white p-6 border border-surface-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900">🏪 Mi Kiosco</h2>
              {!editingKiosk && (
                <button onClick={handleEditKiosk} className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">Editar</button>
              )}
            </div>
            {editingKiosk ? (
              <div className="flex flex-col gap-3">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" className="rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400" style={{ padding: '0.75rem 1rem' }} />
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Dirección" className="rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400" style={{ padding: '0.75rem 1rem' }} />
                <div className="flex gap-2">
                  <button onClick={() => setEditingKiosk(false)} className="px-4 py-2 rounded-xl border border-surface-200 text-sm text-surface-600 hover:bg-surface-50">Cancelar</button>
                  <button onClick={saveKiosk} disabled={saving} className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
                    {saving ? <Spinner size="sm" /> : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-surface-900 font-semibold text-lg">{kiosk.name}</p>
                <p className="text-sm text-surface-500 mt-1">📍 {kiosk.address}</p>
              </div>
            )}
          </div>

          {/* Branches */}
          <div className="rounded-2xl bg-white p-6 border border-surface-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900">📍 Sucursales ({branches.length})</h2>
              <button onClick={() => setShowBranchForm(!showBranchForm)} className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                {showBranchForm ? 'Cancelar' : '+ Agregar'}
              </button>
            </div>
            {showBranchForm && (
              <div className="mb-4 p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col gap-3 animate-scale-in">
                <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Nombre de sucursal" className="rounded-xl border border-surface-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-400" style={{ padding: '0.75rem 1rem' }} />
                <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Dirección" className="rounded-xl border border-surface-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-400" style={{ padding: '0.75rem 1rem' }} />
                <button onClick={addBranch} disabled={saving || !branchName.trim() || !branchAddress.trim()} className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2 self-end">
                  {saving ? <Spinner size="sm" /> : 'Crear sucursal'}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {branches.map((b) => (
                <div key={b.id} className="rounded-xl bg-surface-50 p-4 border border-surface-100 hover:border-primary-200 transition-all">
                  <h3 className="font-semibold text-surface-900">{b.name}</h3>
                  <p className="text-xs text-surface-500 mt-1">{b.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Invite codes */}
          <div className="rounded-2xl bg-white p-6 border border-surface-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900">🔑 Códigos de Empleado</h2>
              <button onClick={() => { setShowInviteModal(true); setGeneratedCode(null); setInviteBranchId(branches[0]?.id || null); }} className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                + Generar código
              </button>
            </div>
            {/* Active codes */}
            {kiosk.inviteCodes && kiosk.inviteCodes.length > 0 ? (
              <div className="flex flex-col gap-2">
                {kiosk.inviteCodes.map((ic) => (
                  <div key={ic.id} className="rounded-xl bg-surface-50 p-3 border border-surface-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-primary-600 tracking-widest">{ic.code}</span>
                      <span className="text-xs text-surface-400 ml-2">→ {ic.branch?.name}</span>
                    </div>
                    <span className="text-xs text-surface-400">Expira: {new Date(ic.expiresAt).toLocaleDateString('es-AR')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400">No hay códigos activos</p>
            )}
          </div>
        </div>
      )}

      {/* Empleado: show assigned branch */}
      {isEmpleado && selectedBranch && (
        <div className="rounded-2xl bg-white p-6 border border-surface-100">
          <h2 className="text-lg font-bold text-surface-900 mb-2">📍 Tu Sucursal</h2>
          <p className="text-surface-900 font-semibold">{selectedBranch.name}</p>
          <p className="text-sm text-surface-500 mt-1">{selectedBranch.address}</p>
        </div>
      )}

      {/* Cliente: simple view */}
      {user?.role === 'CLIENTE' && (
        <div className="text-center py-12 bg-white rounded-3xl border border-surface-100 border-dashed">
          <span className="text-5xl block mb-3 animate-float">🗺️</span>
          <p className="text-surface-700 font-medium">Explorá kioscos cerca tuyo</p>
          <p className="text-surface-400 text-sm mt-1">Usá el mapa para encontrar productos y kioscos</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-surface-900 mb-4">Generar código de empleado</h3>
            {!generatedCode ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Sucursal</label>
                  <select value={inviteBranchId || ''} onChange={(e) => setInviteBranchId(Number(e.target.value))}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400" style={{ padding: '0.75rem 1rem' }}>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-surface-200 text-sm text-surface-600">Cancelar</button>
                  <button onClick={generateInvite} disabled={inviteLoading} className="flex-1 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {inviteLoading ? <Spinner size="sm" /> : 'Generar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-surface-500 mb-3">Compartí este código con tu empleado:</p>
                <div className="rounded-2xl bg-primary-50 border-2 border-primary-200 py-4 px-6 mb-4">
                  <span className="text-3xl font-mono font-bold text-primary-600 tracking-[0.3em]">{generatedCode}</span>
                </div>
                <p className="text-xs text-surface-400 mb-4">Válido por 7 días, un solo uso</p>
                <button onClick={() => { navigator.clipboard.writeText(generatedCode); }} className="text-sm text-primary-600 font-semibold hover:text-primary-700">📋 Copiar código</button>
                <div className="mt-4">
                  <button onClick={() => { setShowInviteModal(false); loadData(); }} className="px-6 py-2 rounded-xl gradient-primary text-white text-sm font-semibold">Listo</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
