import { useEffect, useState, FormEvent } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedBranch } from '../store/authSlice';
import { SkeletonCard } from '../components/Skeleton';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { Kiosk, Branch } from '../types';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, selectedBranch } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingKiosk, setEditingKiosk] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [saving, setSaving] = useState(false);
  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  // Branch edit
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
  // Invite code
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteBranchId, setInviteBranchId] = useState<number | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  // Stats
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0 });

  // Create kiosk modal state
  const [showCreateKioskModal, setShowCreateKioskModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createCity, setCreateCity] = useState('Concordia');
  const [createProvince, setCreateProvince] = useState('Entre Ríos');
  const [createPostalCode, setCreatePostalCode] = useState('3200');

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
        setKiosk({ id: data.kiosk.id, name: data.kiosk.name, ownerId: 0, address: '', city: '', postalCode: '', province: '', lat: 0, lng: 0, createdAt: '', branches: [data] });
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
    setEditCity(kiosk.city || '');
    setEditPostalCode(kiosk.postalCode || '');
    setEditProvince(kiosk.province || '');
    setEditingKiosk(true);
  };

  const saveKiosk = async () => {
    if (!kiosk) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/kiosks/${kiosk.id}`, { name: editName, address: editAddress, city: editCity, postalCode: editPostalCode, province: editProvince, lat: kiosk.lat || -34.6, lng: kiosk.lng || -58.38 });
      setKiosk((prev) => prev ? { ...prev, ...data } : data);
      setEditingKiosk(false);
  } catch { /* silent */ }
  setSaving(false);
};

const handleCreateKiosk = async (e: FormEvent) => {
  e.preventDefault();
  if (!createName.trim() || !createAddress.trim()) return;
  setSaving(true);
  try {
    await api.post('/kiosks', {
      name: createName,
      address: createAddress,
      city: createCity,
      province: createProvince,
      postalCode: createPostalCode,
      lat: -31.3929,
      lng: -58.0207,
    });
    toast.success('Kiosco registrado exitosamente');
    setCreateName('');
    setCreateAddress('');
    setCreateCity('Concordia');
    setCreateProvince('Entre Ríos');
    setCreatePostalCode('3200');
    setShowCreateKioskModal(false);
    await loadData();
  } catch (err: any) {
    toast.error(err.response?.data?.error || 'Error al registrar el kiosco');
  }
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

  const startEditBranch = (b: Branch) => {
    setEditingBranchId(b.id);
    setEditBranchName(b.name);
    setEditBranchAddress(b.address);
  };

  const saveBranch = async () => {
    if (!editingBranchId || !editBranchName.trim() || !editBranchAddress.trim()) return;
    setSaving(true);
    try {
      await api.put(`/branches/${editingBranchId}`, {
        name: editBranchName,
        address: editBranchAddress,
        lat: -34.6,
        lng: -58.38,
      });
      setEditingBranchId(null);
      if (selectedBranch?.id === editingBranchId) {
        dispatch(setSelectedBranch({ ...selectedBranch, name: editBranchName, address: editBranchAddress }));
      }
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

  // Branch selector
  if (needsBranchSelection && isAdmin) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 p-5 text-white animate-fade-in-up">
          <div className="relative z-10">
            <p className="text-primary-300 text-xs font-medium mb-0.5">{greeting()}, {user?.name}</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Seleccioná una sucursal</h1>
            <p className="text-surface-400 mt-1 text-xs">Elegí la sucursal con la que querés trabajar hoy</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {branches.map((b, i) => (
              <button key={b.id} onClick={() => selectBranch(b)}
                className={`text-left rounded-xl bg-white p-4 border-2 border-surface-100 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 group animate-fade-in-up delay-${i + 1}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg group-hover:scale-110 transition-transform">📍</span>
                  <h3 className="font-bold text-surface-900 group-hover:text-primary-700 transition-colors">{b.name}</h3>
                </div>
                <p className="text-xs text-surface-500">{b.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Welcome — compact */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 px-6 py-4 text-white animate-fade-in-up">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-primary-300 text-xs font-medium">{greeting()}</p>
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight">{user?.name} 👋</h1>
            <p className="text-surface-400 text-xs mt-0.5">
              {selectedBranch ? `Trabajando en: ${selectedBranch.name}` : 'Resumen de tu red de kioscos.'}
            </p>
          </div>
          {selectedBranch && isAdmin && (
            <button onClick={() => dispatch(setSelectedBranch(null))} className="text-xs text-primary-300 hover:text-white transition-colors underline shrink-0">
              Cambiar sucursal
            </button>
          )}
        </div>
      </div>

      {/* Stats — compact row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : [
          { label: 'Sucursales', value: branches.length, icon: '📍' },
          { label: 'Productos', value: stats.totalProducts, icon: '📦' },
          { label: 'Ventas Hoy', value: stats.totalSales, icon: '💰' },
          { label: 'Rol', value: user?.role || '', icon: '👤' },
        ].map((c, i) => (
          <div key={c.label} className={`rounded-xl bg-white px-4 py-3 border border-surface-100 hover:shadow-md transition-all animate-fade-in-up delay-${i + 1}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{c.icon}</span>
              <div>
                <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">{c.label}</p>
                <p className="text-lg font-extrabold text-surface-900 leading-tight">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin: No kiosk placeholder CTA */}
      {isAdmin && !kiosk && !loading && (
        <div className="rounded-2xl bg-white p-8 border border-surface-100 shadow-sm text-center max-w-md mx-auto my-12 animate-fade-in-up">
          <span className="text-5xl block mb-3 animate-float">🏪</span>
          <h2 className="text-lg font-bold text-surface-900">No tenés un kiosco registrado</h2>
          <p className="text-xs text-surface-500 mt-2 mb-6 leading-relaxed">
            Como administrador, necesitás registrar tu kiosco principal para poder agregar sucursales, gestionar stock y generar códigos de invitación para tus empleados.
          </p>
          <button
            onClick={() => setShowCreateKioskModal(true)}
            className="px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            + Registrar mi Kiosco
          </button>
        </div>
      )}

      {/* Admin: 2-column grid for kiosk + branches */}
      {isAdmin && kiosk && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 auto-rows-min lg:grid-rows-[auto_1fr]">
          {/* Kiosk info/edit */}
          <div className="rounded-xl bg-white p-4 border border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-surface-900">🏪 Mi Kiosco</h2>
              {!editingKiosk && (
                <button onClick={handleEditKiosk} className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors">Editar</button>
              )}
            </div>
            {editingKiosk ? (
              <div className="flex flex-col gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" className="rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Dirección" className="rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                <div className="grid grid-cols-3 gap-2">
                  <input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="Ciudad" className="rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                  <input value={editProvince} onChange={(e) => setEditProvince(e.target.value)} placeholder="Provincia" className="rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                  <input value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)} placeholder="C.P." className="rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingKiosk(false)} className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-50">Cancelar</button>
                  <button onClick={saveKiosk} disabled={saving} className="px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1">
                    {saving ? <Spinner size="sm" /> : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-surface-900 font-semibold">{kiosk.name}</p>
                <p className="text-xs text-surface-500 mt-0.5">📍 {kiosk.address}</p>
                {(kiosk.city || kiosk.province || kiosk.postalCode) && (
                  <p className="text-xs text-surface-400 mt-0.5">
                    {[kiosk.city, kiosk.province, kiosk.postalCode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Invite codes */}
          <div className="rounded-xl bg-white p-4 border border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-surface-900">🔑 Códigos de Empleado</h2>
              <button onClick={() => { setShowInviteModal(true); setGeneratedCode(null); setInviteBranchId(branches[0]?.id || null); }} className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                + Generar
              </button>
            </div>
            {kiosk.inviteCodes && kiosk.inviteCodes.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                {kiosk.inviteCodes.map((ic) => (
                  <div key={ic.id} className="rounded-lg bg-surface-50 px-3 py-2 border border-surface-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary-600 tracking-widest">{ic.code}</span>
                      <span className="text-surface-400 ml-1.5">→ {ic.branch?.name}</span>
                    </div>
                    <span className="text-surface-400">{new Date(ic.expiresAt).toLocaleDateString('es-AR')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-400">No hay códigos activos</p>
            )}
          </div>

          {/* Branches — full width row, stretches to fill */}
          <div className="rounded-xl bg-white p-4 border border-surface-100 lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-surface-900">📍 Sucursales ({branches.length})</h2>
              <button onClick={() => setShowBranchForm(!showBranchForm)} className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                {showBranchForm ? 'Cancelar' : '+ Agregar'}
              </button>
            </div>
            {showBranchForm && (
              <div className="mb-3 p-3 rounded-lg bg-surface-50 border border-surface-200 flex flex-col sm:flex-row gap-2 animate-scale-in">
                <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Nombre de sucursal" className="flex-1 rounded-lg border border-surface-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Dirección" className="flex-1 rounded-lg border border-surface-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2" />
                <button onClick={addBranch} disabled={saving || !branchName.trim() || !branchAddress.trim()} className="px-4 py-2 rounded-lg gradient-primary text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1 shrink-0">
                  {saving ? <Spinner size="sm" /> : 'Crear'}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 flex-1 overflow-y-auto content-start">
              {branches.map((b) => (
                <div key={b.id} className="rounded-lg bg-surface-50 p-3 border border-surface-100 hover:border-primary-200 transition-all">
                  {editingBranchId === b.id ? (
                    <div className="flex flex-col gap-1.5 animate-scale-in">
                      <input value={editBranchName} onChange={(e) => setEditBranchName(e.target.value)} placeholder="Nombre"
                        className="rounded-lg border border-surface-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-400 px-2.5 py-1.5" />
                      <input value={editBranchAddress} onChange={(e) => setEditBranchAddress(e.target.value)} placeholder="Dirección"
                        className="rounded-lg border border-surface-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-400 px-2.5 py-1.5" />
                      <div className="flex gap-1.5 mt-0.5">
                        <button onClick={() => setEditingBranchId(null)} className="px-2.5 py-1 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-100">Cancelar</button>
                        <button onClick={saveBranch} disabled={saving || !editBranchName.trim() || !editBranchAddress.trim()}
                          className="px-2.5 py-1 rounded-lg gradient-primary text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1">
                          {saving ? <Spinner size="sm" /> : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-surface-900 text-sm">{b.name}</h3>
                        <p className="text-xs text-surface-500 mt-0.5">{b.address}</p>
                      </div>
                      <button onClick={() => startEditBranch(b)} className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors shrink-0 ml-2">
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empleado: show assigned branch */}
      {isEmpleado && selectedBranch && (
        <div className="rounded-xl bg-white p-4 border border-surface-100">
          <h2 className="text-sm font-bold text-surface-900 mb-1">📍 Tu Sucursal</h2>
          <p className="text-surface-900 font-semibold text-sm">{selectedBranch.name}</p>
          <p className="text-xs text-surface-500 mt-0.5">{selectedBranch.address}</p>
        </div>
      )}

      {/* Cliente: simple view */}
      {user?.role === 'CLIENTE' && (
        <div className="text-center py-8 bg-white rounded-2xl border border-surface-100 border-dashed">
          <span className="text-4xl block mb-2 animate-float">🗺️</span>
          <p className="text-surface-700 font-medium text-sm">Explorá kioscos cerca tuyo</p>
          <p className="text-surface-400 text-xs mt-1">Usá el mapa para encontrar productos y kioscos</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-surface-900 mb-3">Generar código de empleado</h3>
            {!generatedCode ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">Sucursal</label>
                  <select value={inviteBranchId || ''} onChange={(e) => setInviteBranchId(Number(e.target.value))}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2">
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowInviteModal(false)} className="flex-1 px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-600">Cancelar</button>
                  <button onClick={generateInvite} disabled={inviteLoading} className="flex-1 px-3 py-2 rounded-lg gradient-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {inviteLoading ? <Spinner size="sm" /> : 'Generar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-surface-500 mb-2">Compartí este código con tu empleado:</p>
                <div className="rounded-xl bg-primary-50 border-2 border-primary-200 py-3 px-4 mb-3">
                  <span className="text-2xl font-mono font-bold text-primary-600 tracking-[0.3em]">{generatedCode}</span>
                </div>
                <p className="text-xs text-surface-400 mb-3">Válido por 7 días, un solo uso</p>
                <button onClick={() => { navigator.clipboard.writeText(generatedCode); }} className="text-xs text-primary-600 font-semibold hover:text-primary-700">📋 Copiar código</button>
                <div className="mt-3">
                  <button onClick={() => { setShowInviteModal(false); loadData(); }} className="px-5 py-2 rounded-lg gradient-primary text-white text-sm font-semibold">Listo</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Kiosk Modal */}
      {showCreateKioskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCreateKioskModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-surface-900 mb-2">Registrar mi Kiosco</h3>
            <p className="text-xs text-surface-400 mb-5 leading-normal">Ingresá los datos de tu kiosco principal. La ubicación se geocodificará en el mapa de Concordia.</p>
            <form onSubmit={handleCreateKiosk} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Nombre del Kiosco</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ej: Kiosco Don Carlos"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2 transition-all focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Dirección (Calle y Número)</label>
                <input
                  type="text"
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  placeholder="Ej: Pellegrini 450"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2 transition-all focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={createCity}
                    onChange={(e) => setCreateCity(e.target.value)}
                    placeholder="Ej: Concordia"
                    required
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2 transition-all focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">C.P.</label>
                  <input
                    type="text"
                    value={createPostalCode}
                    onChange={(e) => setCreatePostalCode(e.target.value)}
                    placeholder="3200"
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2 transition-all focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={createProvince}
                  onChange={(e) => setCreateProvince(e.target.value)}
                  placeholder="Ej: Entre Ríos"
                  required
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2 transition-all focus:bg-white"
                />
              </div>
              
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateKioskModal(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !createName.trim() || !createAddress.trim()}
                  className="flex-1 px-3 py-2 rounded-lg gradient-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5 transition-opacity"
                >
                  {saving ? <Spinner size="sm" /> : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
