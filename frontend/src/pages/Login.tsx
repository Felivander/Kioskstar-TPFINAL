import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { loginUser, clearError } from '../store/authSlice';
import Spinner from '../components/Spinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent-500/6 rounded-full blur-2xl animate-float delay-5" />

      {/* Left branding — desktop only */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-16 relative z-10">
        <div className="animate-fade-in-up">
          <span className="text-7xl block mb-6 animate-float">🌟</span>
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
            Kiosk<span className="text-primary-300">Star</span>
          </h1>
          <p className="text-primary-200/80 mt-4 text-lg leading-relaxed max-w-sm">
            La red inteligente que transforma la gestión de tu kiosco.
          </p>
          <div className="mt-8 flex gap-3">
            {['Stock en tiempo real', 'Pagos digitales', 'Mapa público'].map((tag, i) => (
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
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10 animate-fade-in-up">
            <span className="text-5xl block mb-3 animate-float">🌟</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Kiosk<span className="text-primary-300">Star</span>
            </h1>
          </div>

          {/* Card */}
          <div
            className="glass rounded-3xl shadow-2xl animate-fade-in-up delay-1"
            style={{ padding: '2.5rem' }}
          >
            <h2 className="text-2xl font-bold text-surface-900 mb-1">Bienvenido</h2>
            <p className="text-surface-500 text-sm mb-8">Ingresá a tu cuenta para continuar</p>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-scale-in"
                style={{ padding: '0.75rem 1rem' }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                  style={{ padding: '0.875rem 1rem' }}
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                  style={{ padding: '0.875rem 1rem' }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                style={{ padding: '0.875rem 1rem' }}
              >
                {loading ? <Spinner size="sm" /> : 'Ingresar'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-surface-100 text-center">
              <p className="text-sm text-surface-500">
                ¿No tenés cuenta?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Registrate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
