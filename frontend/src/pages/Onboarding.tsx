import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { onboardUser, joinKiosk, clearError } from '../store/authSlice';
import Spinner from '../components/Spinner';

type Step = 'choice' | 'invite-code' | 'kiosk-name' | 'kiosk-address' | 'has-branches' | 'add-branch' | 'done';

interface BranchData {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function Onboarding() {
  const [step, setStep] = useState<Step>('choice');
  const [kioskName, setKioskName] = useState('');
  const [kioskAddress, setKioskAddress] = useState('');
  const [kioskCity, setKioskCity] = useState('');
  const [kioskPostalCode, setKioskPostalCode] = useState('');
  const [kioskProvince, setKioskProvince] = useState('');
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Título y subtítulo por step
  const stepInfo: Record<Step, { title: string; subtitle: string; icon: string }> = {
    'choice': { title: '¡Bienvenido a KioskStar!', subtitle: '¿Qué querés hacer?', icon: '👋' },
    'invite-code': { title: 'Código de empleado', subtitle: 'Ingresá el código que te dió el dueño del kiosco', icon: '🔑' },
    'kiosk-name': { title: '¡Armemos tu kiosco!', subtitle: '¿Cómo se llama tu kiosco?', icon: '🏪' },
    'kiosk-address': { title: 'Ubicación', subtitle: '¿Dónde queda tu kiosco?', icon: '📍' },
    'has-branches': { title: 'Sucursales', subtitle: '¿Tenés otras sucursales además de la principal?', icon: '🏢' },
    'add-branch': { title: 'Nueva sucursal', subtitle: 'Agregá los datos de la sucursal', icon: '➕' },
    'done': { title: '¡Todo listo!', subtitle: 'Tu kiosco está configurado', icon: '🎉' },
  };

  const handleChoiceCliente = async () => {
    const result = await dispatch(onboardUser({ choice: 'CLIENTE' }));
    if (onboardUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleChoiceKiosk = () => {
    dispatch(clearError());
    setStep('kiosk-name');
  };

  const handleChoiceEmpleado = () => {
    dispatch(clearError());
    setStep('invite-code');
  };

  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(joinKiosk({ code: inviteCode }));
    if (joinKiosk.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleKioskNameNext = (e: FormEvent) => {
    e.preventDefault();
    setStep('kiosk-address');
  };

  const handleKioskAddressNext = (e: FormEvent) => {
    e.preventDefault();
    setStep('has-branches');
  };

  const handleHasBranchesYes = () => {
    setBranchName('');
    setBranchAddress('');
    setStep('add-branch');
  };

  const handleHasBranchesNo = async () => {
    await submitOnboarding();
  };

  const handleAddBranch = (e: FormEvent) => {
    e.preventDefault();
    setBranches([...branches, { name: branchName, address: branchAddress, lat: -34.6037, lng: -58.3816 }]);
    setBranchName('');
    setBranchAddress('');
    setStep('has-branches');
  };

  const submitOnboarding = async () => {
    const result = await dispatch(onboardUser({
      choice: 'KIOSK',
      kioskName,
      kioskAddress,
      kioskCity,
      kioskPostalCode,
      kioskProvince,
      kioskLat: -34.6037,
      kioskLng: -58.3816,
      branches,
    }));
    if (onboardUser.fulfilled.match(result)) {
      setStep('done');
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  const { title, subtitle, icon } = stepInfo[step];

  // Progreso visual
  const stepOrder: Step[] = ['choice', 'kiosk-name', 'kiosk-address', 'has-branches'];
  const currentIdx = stepOrder.indexOf(step);
  const progress = step === 'done' ? 100 : step === 'choice' || step === 'invite-code' ? 0 : ((currentIdx) / stepOrder.length) * 100;

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-up" key={step}>
            <span className="text-5xl block mb-3 animate-float">{icon}</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-primary-200/70 mt-2 text-sm">{subtitle}</p>
          </div>

          {/* Progress bar */}
          {step !== 'choice' && step !== 'invite-code' && (
            <div className="w-full max-w-md mx-auto mb-6 animate-fade-in">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Card */}
          <div
            className="glass rounded-3xl shadow-2xl animate-scale-in"
            style={{ padding: '2rem 2.5rem' }}
            key={`card-${step}`}
          >
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-scale-in"
                style={{ padding: '0.75rem 1rem' }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            {/* ── STEP: Choice ── */}
            {step === 'choice' && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleChoiceCliente}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-surface-200 bg-white hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 text-left group"
                  style={{ padding: '1.25rem 1.5rem' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🗺️</span>
                    <div>
                      <span className="text-base font-bold text-surface-900 block">Soy cliente</span>
                      <span className="text-sm text-surface-500">Quiero explorar kioscos y buscar productos</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleChoiceKiosk}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-surface-200 bg-white hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 text-left group"
                  style={{ padding: '1.25rem 1.5rem' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🏪</span>
                    <div>
                      <span className="text-base font-bold text-surface-900 block">Tengo un kiosco</span>
                      <span className="text-sm text-surface-500">Quiero gestionar mi negocio</span>
                    </div>
                  </div>
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white/80 text-surface-400" style={{ padding: '0 0.75rem' }}>o</span>
                  </div>
                </div>

                <button
                  onClick={handleChoiceEmpleado}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-dashed border-surface-300 bg-white/50 hover:border-accent-400 hover:bg-accent-300/10 transition-all duration-200 text-left group"
                  style={{ padding: '1rem 1.5rem' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🔑</span>
                    <div>
                      <span className="text-sm font-semibold text-surface-700 block">Tengo un código de empleado</span>
                      <span className="text-xs text-surface-400">Me dieron un código para unirme a un kiosco</span>
                    </div>
                  </div>
                </button>

                {loading && (
                  <div className="flex justify-center mt-2">
                    <Spinner size="md" />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: Invite Code ── */}
            {step === 'invite-code' && (
              <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="invite-code" className="block text-sm font-medium text-surface-700 mb-1.5">
                    Código de invitación
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); dispatch(clearError()); }}
                    required
                    maxLength={8}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-lg text-center font-mono tracking-[0.3em] text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    style={{ padding: '1rem' }}
                    placeholder="XXXXXXXX"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep('choice'); dispatch(clearError()); }}
                    className="flex-1 rounded-2xl border-2 border-surface-200 text-surface-600 font-semibold text-sm hover:bg-surface-50 transition-all"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={loading || inviteCode.length < 8}
                    className="flex-1 rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    {loading ? <Spinner size="sm" /> : 'Unirme'}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP: Kiosk Name ── */}
            {step === 'kiosk-name' && (
              <form onSubmit={handleKioskNameNext} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="kiosk-name" className="block text-sm font-medium text-surface-700 mb-1.5">
                    Nombre del kiosco
                  </label>
                  <input
                    id="kiosk-name"
                    type="text"
                    value={kioskName}
                    onChange={(e) => setKioskName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    style={{ padding: '0.875rem 1rem' }}
                    placeholder="Ej: Kiosco Don Carlos"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('choice')}
                    className="flex-1 rounded-2xl border-2 border-surface-200 text-surface-600 font-semibold text-sm hover:bg-surface-50 transition-all"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={kioskName.trim().length < 2}
                    className="flex-1 rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Siguiente →
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP: Kiosk Address ── */}
            {step === 'kiosk-address' && (
              <form onSubmit={handleKioskAddressNext} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="kiosk-address" className="block text-sm font-medium text-surface-700 mb-1.5">
                    Dirección
                  </label>
                  <input
                    id="kiosk-address"
                    type="text"
                    value={kioskAddress}
                    onChange={(e) => setKioskAddress(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    style={{ padding: '0.875rem 1rem' }}
                    placeholder="Ej: Av. Corrientes 1234"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="kiosk-city" className="block text-sm font-medium text-surface-700 mb-1.5">
                      Ciudad
                    </label>
                    <input
                      id="kiosk-city"
                      type="text"
                      value={kioskCity}
                      onChange={(e) => setKioskCity(e.target.value)}
                      className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                      style={{ padding: '0.875rem 1rem' }}
                      placeholder="Ej: CABA"
                    />
                  </div>
                  <div>
                    <label htmlFor="kiosk-province" className="block text-sm font-medium text-surface-700 mb-1.5">
                      Provincia
                    </label>
                    <input
                      id="kiosk-province"
                      type="text"
                      value={kioskProvince}
                      onChange={(e) => setKioskProvince(e.target.value)}
                      className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                      style={{ padding: '0.875rem 1rem' }}
                      placeholder="Ej: Buenos Aires"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="kiosk-cp" className="block text-sm font-medium text-surface-700 mb-1.5">
                    Código Postal
                  </label>
                  <input
                    id="kiosk-cp"
                    type="text"
                    value={kioskPostalCode}
                    onChange={(e) => setKioskPostalCode(e.target.value)}
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    style={{ padding: '0.875rem 1rem' }}
                    placeholder="Ej: C1043"
                    maxLength={10}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('kiosk-name')}
                    className="flex-1 rounded-2xl border-2 border-surface-200 text-surface-600 font-semibold text-sm hover:bg-surface-50 transition-all"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    ← Volver
                  </button>
                  <button
                    type="submit"
                    disabled={kioskAddress.trim().length < 5}
                    className="flex-1 rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Siguiente →
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP: Has Branches? ── */}
            {step === 'has-branches' && (
              <div className="flex flex-col gap-4">
                {/* Mostrar sucursales agregadas */}
                {branches.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-surface-500 mb-2">Sucursales agregadas:</p>
                    <div className="flex flex-col gap-2">
                      {branches.map((b, i) => (
                        <div key={i} className="rounded-xl bg-accent-300/10 border border-accent-400/20 text-sm text-surface-700 flex items-center gap-2" style={{ padding: '0.5rem 0.75rem' }}>
                          <span className="text-accent-500">✓</span>
                          <span className="font-medium">{b.name}</span>
                          <span className="text-surface-400">—</span>
                          <span className="text-surface-500 text-xs">{b.address}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-center text-surface-700 font-medium">
                  {branches.length === 0
                    ? '¿Tenés otras sucursales además de la principal?'
                    : '¿Querés agregar otra sucursal?'}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleHasBranchesNo}
                    disabled={loading}
                    className="flex-1 rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    {loading ? <Spinner size="sm" /> : (branches.length === 0 ? 'No, solo una' : 'No, listo')}
                  </button>
                  <button
                    onClick={handleHasBranchesYes}
                    disabled={loading}
                    className="flex-1 rounded-2xl border-2 border-primary-400 text-primary-600 font-semibold text-sm hover:bg-primary-50 transition-all"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Sí, agregar
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: Add Branch ── */}
            {step === 'add-branch' && (
              <form onSubmit={handleAddBranch} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="branch-name" className="block text-sm font-medium text-surface-700 mb-1.5">
                    Nombre de la sucursal
                  </label>
                  <input
                    id="branch-name"
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    style={{ padding: '0.875rem 1rem' }}
                    placeholder="Ej: Sucursal Palermo"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="branch-address" className="block text-sm font-medium text-surface-700 mb-1.5">
                    Dirección
                  </label>
                  <input
                    id="branch-address"
                    type="text"
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    style={{ padding: '0.875rem 1rem' }}
                    placeholder="Ej: Av. Santa Fe 4500, CABA"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('has-branches')}
                    className="flex-1 rounded-2xl border-2 border-surface-200 text-surface-600 font-semibold text-sm hover:bg-surface-50 transition-all"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={branchName.trim().length < 2 || branchAddress.trim().length < 5}
                    className="flex-1 rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    Agregar
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP: Done ── */}
            {step === 'done' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4 animate-scale-in">✅</div>
                <p className="text-surface-700 font-medium">
                  ¡<strong>{kioskName}</strong> está listo!
                </p>
                <p className="text-surface-500 text-sm mt-2">Redirigiendo al panel de administración...</p>
                <div className="flex justify-center mt-4">
                  <Spinner size="md" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
