import { useEffect, useState, FormEvent } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setSelectedBranch } from '../store/authSlice';
import { SkeletonCard } from '../components/Skeleton';
import Spinner from '../components/Spinner';
import api from '../services/api';
import { Kiosk, Branch } from '../types';
import { toast } from 'react-hot-toast';
import { Store, MapPin, Key, Copy, ShieldAlert } from 'lucide-react';

export default function MyKiosk() {
  const { user, selectedBranch } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Kiosk editing state
  const [editingKiosk, setEditingKiosk] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [saving, setSaving] = useState(false);

  // Branch creation form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  // Branch editing
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');

  // Invite codes modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteBranchId, setInviteBranchId] = useState<number | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Create kiosk modal
  const [showCreateKioskModal, setShowCreateKioskModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createCity, setCreateCity] = useState('Concordia');
  const [createProvince, setCreateProvince] = useState('Entre Ríos');
  const [createPostalCode, setCreatePostalCode] = useState('3200');

  const isAdmin = user?.role === 'ADMIN';
  const isEmpleado = user?.role === 'EMPLEADO';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const { data } = await api.get('/auth/my-kiosk');
        setKiosk(data);
      } else if (isEmpleado && user?.branchId) {
        const { data } = await api.get('/auth/my-branch');
        setKiosk({
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
        });
      }
    } catch (error) {
      console.error('Error al cargar datos de kiosco:', error);
    }
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
      const { data } = await api.put(`/kiosks/${kiosk.id}`, {
        name: editName,
        address: editAddress,
        city: editCity,
        postalCode: editPostalCode,
        province: editProvince,
        lat: kiosk.lat || -31.3929,
        lng: kiosk.lng || -58.0207,
      });
      setKiosk((prev) => (prev ? { ...prev, ...data } : data));
      setEditingKiosk(false);
      toast.success('Datos del kiosco actualizados');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar el kiosco');
    }
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
      await api.post(`/kiosks/${kiosk.id}/branches`, {
        name: branchName,
        address: branchAddress,
        lat: kiosk.lat || -31.3929,
        lng: kiosk.lng || -58.0207,
      });
      setBranchName('');
      setBranchAddress('');
      setShowBranchForm(false);
      toast.success('Sucursal creada exitosamente');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear la sucursal');
    }
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
        lat: -31.3929,
        lng: -58.0207,
      });
      setEditingBranchId(null);
      if (selectedBranch?.id === editingBranchId) {
        dispatch(
          setSelectedBranch({
            ...selectedBranch,
            name: editBranchName,
            address: editBranchAddress,
          })
        );
      }
      toast.success('Sucursal actualizada exitosamente');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar la sucursal');
    }
    setSaving(false);
  };

  const generateInvite = async () => {
    if (!kiosk || !inviteBranchId) return;
    setInviteLoading(true);
    try {
      const { data } = await api.post(`/auth/kiosks/${kiosk.id}/invite-code`, {
        branchId: inviteBranchId,
      });
      setGeneratedCode(data.code);
      toast.success('Código de invitación generado');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar código');
    }
    setInviteLoading(false);
  };

  const branches = kiosk?.branches || [];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4 px-2">
        <div className="h-20 bg-white border border-surface-200/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Si el usuario es empleado, solo ve su sucursal de forma informativa
  if (isEmpleado) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4 px-2 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold text-surface-950 tracking-tight">Mi Kiosco</h2>
          <p className="text-sm text-surface-500 mt-1">Información de la sucursal asignada.</p>
        </div>
        
        {selectedBranch ? (
          <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Store size={32} className="text-primary-600" />
              <div>
                <h3 className="text-lg font-bold text-surface-900">{kiosk?.name}</h3>
                <p className="text-xs text-surface-400 mt-0.5">Sucursal: {selectedBranch.name}</p>
              </div>
            </div>
            <div className="border-t border-surface-100 pt-4">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Dirección de Trabajo</p>
              <p className="text-sm text-surface-800 mt-1 font-medium flex items-center gap-1">
                <MapPin size={14} className="text-surface-400 shrink-0" />
                <span>{selectedBranch.address}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm text-center">
            <p className="text-sm text-surface-500">No tenés sucursal asignada o seleccionada en este momento.</p>
          </div>
        )}
      </div>
    );
  }

  // Si no es admin ni empleado
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <ShieldAlert size={40} className="mx-auto mb-2 text-surface-400" />
        <p className="text-surface-700 font-medium text-sm">Área restringida</p>
        <p className="text-surface-400 text-xs mt-1">Solo administradores y empleados pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 px-2 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-surface-950 tracking-tight">Mi Red de Kioscos</h2>
        <p className="text-sm text-surface-500 mt-1">
          Gestioná la configuración principal de tu kiosco, administrá sucursales y generá códigos para empleados.
        </p>
      </div>

      {/* Admin: No kiosk placeholder CTA */}
      {!kiosk ? (
        <div className="rounded-2xl bg-white p-8 border border-surface-200/60 shadow-sm text-center max-w-md mx-auto my-8 space-y-4 flex flex-col items-center">
          <Store size={48} className="text-primary-600 animate-float" />
          <h2 className="text-lg font-bold text-surface-900">Registrá tu kiosco principal</h2>
          <p className="text-xs text-surface-500 leading-relaxed">
            Como administrador, necesitás registrar tu marca o local principal de kiosco para poder configurar sucursales, cargar stocks de productos y habilitar a tus empleados.
          </p>
          <button
            onClick={() => setShowCreateKioskModal(true)}
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer inline-block"
          >
            + Registrar mi Kiosco
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Kiosk Info and Branches */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kiosk Info details card */}
            <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-surface-900">Datos Generales</h3>
                {!editingKiosk && (
                  <button
                    onClick={handleEditKiosk}
                    className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    Editar Datos
                  </button>
                )}
              </div>

              {editingKiosk ? (
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Nombre</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre del kiosco"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Dirección</label>
                    <input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Dirección"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Ciudad</label>
                      <input
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Ciudad"
                        className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Provincia</label>
                      <input
                        value={editProvince}
                        onChange={(e) => setEditProvince(e.target.value)}
                        placeholder="Provincia"
                        className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">C.P.</label>
                      <input
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
                        placeholder="C.P."
                        className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2.5 mt-2 justify-end">
                    <button
                      onClick={() => setEditingKiosk(false)}
                      className="px-4 py-2 rounded-xl border border-surface-200 text-xs text-surface-600 hover:bg-surface-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveKiosk}
                      disabled={saving || !editName.trim() || !editAddress.trim()}
                      className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                    >
                      {saving ? <Spinner size="sm" /> : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Store size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-surface-900 leading-snug">{kiosk.name}</p>
                    <p className="text-sm text-surface-500 font-medium flex items-center gap-1">
                      <MapPin size={14} className="text-surface-400 shrink-0" />
                      <span>{kiosk.address}</span>
                    </p>
                    {(kiosk.city || kiosk.province || kiosk.postalCode) && (
                      <p className="text-xs text-surface-400">
                        {[kiosk.city, kiosk.province, kiosk.postalCode].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Branches Card */}
            <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-surface-900 flex items-center gap-1.5">
                  <MapPin size={18} className="text-surface-500 shrink-0" />
                  <span>Sucursales ({branches.length})</span>
                </h3>
                <button
                  onClick={() => setShowBranchForm(!showBranchForm)}
                  className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors cursor-pointer"
                >
                  {showBranchForm ? 'Cancelar' : '+ Agregar Sucursal'}
                </button>
              </div>

              {showBranchForm && (
                <div className="mb-4 p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col gap-3 animate-scale-in">
                  <h4 className="text-xs font-bold text-surface-600">Nueva Sucursal</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Nombre de sucursal (Ej: Centro)"
                      className="rounded-xl border border-surface-200 bg-white text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <input
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                      placeholder="Dirección (Ej: Pellegrini 230)"
                      className="rounded-xl border border-surface-200 bg-white text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <button
                    onClick={addBranch}
                    disabled={saving || !branchName.trim() || !branchAddress.trim()}
                    className="px-4.5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1.5 self-end shadow-sm hover:shadow cursor-pointer"
                  >
                    {saving ? <Spinner size="sm" /> : 'Crear Sucursal'}
                  </button>
                </div>
              )}

              {branches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl bg-surface-50/50 p-4 border border-surface-200/50 hover:border-primary-200 hover:bg-white hover:shadow-sm transition-all"
                    >
                      {editingBranchId === b.id ? (
                        <div className="flex flex-col gap-2.5 animate-scale-in">
                          <input
                            value={editBranchName}
                            onChange={(e) => setEditBranchName(e.target.value)}
                            placeholder="Nombre"
                            className="w-full rounded-lg border border-surface-200 bg-white text-sm px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          />
                          <input
                            value={editBranchAddress}
                            onChange={(e) => setEditBranchAddress(e.target.value)}
                            placeholder="Dirección"
                            className="w-full rounded-lg border border-surface-200 bg-white text-sm px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingBranchId(null)}
                              className="px-2.5 py-1 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-100 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={saveBranch}
                              disabled={saving || !editBranchName.trim() || !editBranchAddress.trim()}
                              className="px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                            >
                              {saving ? <Spinner size="sm" /> : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-surface-900 text-sm">{b.name}</h4>
                            <p className="text-xs text-surface-500 mt-1 font-medium flex items-center gap-1">
                              <MapPin size={14} className="text-surface-400 shrink-0" />
                              <span>{b.address}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => startEditBranch(b)}
                            className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors shrink-0 cursor-pointer"
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-surface-200 rounded-xl bg-surface-50/20">
                  <p className="text-xs text-surface-400 font-medium">No hay sucursales registradas aún.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Invite Codes */}
          <div className="space-y-6">
            <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-surface-900 flex items-center gap-1.5">
                  <Key size={18} className="text-surface-500 shrink-0" />
                  <span>Códigos de Empleado</span>
                </h3>
                {branches.length > 0 && (
                  <button
                    onClick={() => {
                      setShowInviteModal(true);
                      setGeneratedCode(null);
                      setInviteBranchId(branches[0]?.id || null);
                    }}
                    className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    + Generar
                  </button>
                )}
              </div>

              {kiosk.inviteCodes && kiosk.inviteCodes.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {kiosk.inviteCodes.map((ic) => (
                    <div
                      key={ic.id}
                      className="rounded-xl bg-surface-50 p-3 border border-surface-200/40 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-primary-600 tracking-wider bg-primary-50 px-2 py-0.5 rounded">
                          {ic.code}
                        </span>
                        <span className="text-surface-400 block text-[10px] mt-0.5 font-medium">
                          Sucursal: {ic.branch?.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-surface-400 font-medium bg-surface-100 px-2 py-0.5 rounded-full">
                        {new Date(ic.expiresAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-surface-200 rounded-xl bg-surface-50/20">
                  <p className="text-xs text-surface-400 font-medium">No hay códigos activos.</p>
                  {branches.length === 0 && (
                    <p className="text-[10px] text-surface-400 mt-1 font-normal">
                      Debés agregar al menos una sucursal para poder generar códigos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-surface-200 shadow-2xl w-full max-w-sm p-6 animate-scale-in z-10 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-surface-900">Generar código de empleado</h3>
            {!generatedCode ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                    Asignar a Sucursal
                  </label>
                  <select
                    value={inviteBranchId || ''}
                    onChange={(e) => setInviteBranchId(Number(e.target.value))}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end mt-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl border border-surface-200 text-xs text-surface-600 hover:bg-surface-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={generateInvite}
                    disabled={inviteLoading}
                    className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                  >
                    {inviteLoading ? <Spinner size="sm" /> : 'Generar Código'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-xs text-surface-500">Compartí este código con tu empleado para el onboarding:</p>
                <div className="rounded-2xl bg-primary-50 border-2 border-primary-100 py-3.5 px-4 shadow-inner">
                  <span className="text-3xl font-mono font-bold text-primary-600 tracking-wider">
                    {generatedCode}
                  </span>
                </div>
                <p className="text-[10px] text-surface-400 font-medium">Válido por 7 días, un solo uso.</p>
                <div className="flex flex-col gap-2 pt-2 border-t border-surface-100">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      toast.success('Código copiado al portapapeles');
                    }}
                    className="text-xs text-primary-600 font-bold hover:text-primary-700 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Copy size={14} />
                    <span>Copiar al portapapeles</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      loadData();
                    }}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition-all mt-1 cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Kiosk Modal */}
      {showCreateKioskModal && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0"
            onClick={() => setShowCreateKioskModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-surface-200 shadow-2xl w-full max-w-md p-6 animate-scale-in z-10 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-surface-950">Registrar mi Kiosco</h3>
              <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                Ingresá los datos de tu kiosco principal. La ubicación se geocodificará en el mapa de Concordia.
              </p>
            </div>
            
            <form onSubmit={handleCreateKiosk} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Nombre del Kiosco
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ej: Kiosco Don Carlos"
                  required
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Dirección (Calle y Número)
                </label>
                <input
                  type="text"
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  placeholder="Ej: Pellegrini 450"
                  required
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={createCity}
                    onChange={(e) => setCreateCity(e.target.value)}
                    placeholder="Ej: Concordia"
                    required
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                    C.P.
                  </label>
                  <input
                    type="text"
                    value={createPostalCode}
                    onChange={(e) => setCreatePostalCode(e.target.value)}
                    placeholder="3200"
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Provincia
                </label>
                <input
                  type="text"
                  value={createProvince}
                  onChange={(e) => setCreateProvince(e.target.value)}
                  placeholder="Ej: Entre Ríos"
                  required
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 text-sm px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all focus:bg-white"
                />
              </div>
              
              <div className="flex gap-3 justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateKioskModal(false)}
                  className="px-4.5 py-2 rounded-xl border border-surface-200 text-xs text-surface-600 hover:bg-surface-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !createName.trim() || !createAddress.trim()}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer transition-opacity"
                >
                  {saving ? <Spinner size="sm" /> : 'Registrar Kiosco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
