import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, AlertTriangle } from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { registerUser, clearError } from '../store/authSlice';
import Spinner from '../components/Spinner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(result)) {
      navigate('/onboarding');
    }
  };

  return (
    <div className="h-screen w-screen flex gradient-hero relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent-500/6 rounded-full blur-2xl animate-float delay-5" />

      {/* Left branding — desktop only */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-16 relative z-10">
        <div className="animate-fade-in-up flex flex-col items-center">
          <Star className="w-16 h-16 text-primary-400 fill-primary-400/20 mb-6 animate-float" />
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight text-center">
            Kiosk<span className="text-primary-300">Star</span>
          </h1>
          <p className="text-primary-200/80 mt-4 text-lg leading-relaxed max-w-sm text-center">
            Creá tu cuenta y empezá a gestionar tu red de kioscos hoy mismo.
          </p>
          <div className="mt-8 flex gap-3">
            {['Control total', 'Fácil de usar', '100% Digital'].map((tag, i) => (
              <span
                key={tag}
                className={`text-xs rounded-full border border-white/10 text-primary-300/70 bg-white/5 animate-fade-in-up delay-${i + 2}`}
                style={{ padding: '0.375rem 0.75rem' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-6 lg:py-12 relative z-10 overflow-y-auto custom-scrollbar h-full">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6 animate-fade-in-up">
            <Star className="w-12 h-12 text-primary-400 fill-primary-400/20 mx-auto mb-2 animate-float" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Kiosk<span className="text-primary-300">Star</span>
            </h1>
          </div>

          {/* Form card */}
          <div
            className="glass rounded-3xl shadow-2xl animate-fade-in-up delay-1 max-h-[90vh] flex flex-col overflow-y-auto custom-scrollbar"
            style={{ padding: '1.5rem 2rem' }}
          >
            <h2 className="text-2xl font-bold text-surface-900 mb-1">Registro</h2>
            <p className="text-surface-500 text-sm mb-5">Completá tus datos para empezar</p>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-scale-in"
                style={{ padding: '0.75rem 1rem' }}
              >
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Name */}
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-surface-700 mb-1">
                  Nombre
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); dispatch(clearError()); }}
                  required
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                  style={{ padding: '0.625rem 1rem' }}
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-surface-700 mb-1">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                  style={{ padding: '0.625rem 1rem' }}
                  placeholder="tu@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-surface-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                  style={{ padding: '0.625rem 1rem' }}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                style={{ padding: '0.75rem 1rem' }}
              >
                {loading ? <Spinner size="sm" /> : 'Crear Cuenta'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-surface-100 text-center">
              <p className="text-sm text-surface-500">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Iniciá sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
