import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { loginUser, clearError, finishSplash } from '../store/authSlice';
import Spinner from '../components/Spinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const [splashFadeOut, setSplashFadeOut] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      setFailedAttempts(0);
      setShowSplash(true);
      setTimeout(() => {
        setSplashFadeOut(true);
      }, 2600);
      setTimeout(() => {
        dispatch(finishSplash());
        navigate('/dashboard');
      }, 3000);
    } else {
      setFailedAttempts((prev) => prev + 1);
    }
  };

  const showRecovery = failedAttempts >= 5;

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent-500/6 rounded-full blur-2xl animate-float delay-5" />

      {/* Left branding — desktop only */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-16 relative z-10">
        <div className="animate-fade-in-up flex flex-col items-center">
          <Star className="w-16 h-16 text-primary-400 fill-primary-400/20 mb-6 animate-float" />
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight text-center">
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
            <Star className="w-12 h-12 text-primary-400 fill-primary-400/20 mx-auto mb-3 animate-float" />
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
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            {/* Recuperación de contraseña — aparece tras 5 intentos fallidos */}
            {showRecovery && (
              <div
                className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm animate-scale-in"
                style={{ padding: '0.75rem 1rem' }}
              >
                <p className="font-semibold mb-1">¿Olvidaste tu contraseña?</p>
                <p className="text-xs text-amber-700 mb-2">
                  Llevás {failedAttempts} intentos fallidos.
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group"
                >
                  Recuperar contraseña <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
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

            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-sm text-surface-400 hover:text-primary-600 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-surface-100 text-center">
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

      {/* Splashscreen de Bienvenida */}
      <AnimatePresence>
        {showSplash && (
          <div
            className={`fixed inset-0 z-50 bg-gradient-to-br from-primary-500 via-primary-600 to-autumn-leaf-600 flex flex-col items-center justify-center text-white transition-opacity duration-500 ${
              splashFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Contenedor del Logo con animación de entrada elástica */}
            <motion.div
              initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 12,
                delay: 0.1,
              }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Star className="w-20 h-20 text-white fill-white/20 animate-float" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: 'easeInOut',
                  }}
                  className="absolute -top-1 -right-1 text-yellow-300"
                >
                  <Sparkles className="w-6 h-6 fill-current" />
                </motion.div>
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight">
                Kiosk<span className="text-primary-200">Star</span>
              </h1>
            </motion.div>

            {/* Línea divisora animada */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: 'easeInOut' }}
              className="w-40 h-[1.5px] bg-white/30 my-8 origin-center"
            />

            {/* Mensaje de Bienvenida personalizado */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                ¡Hola, {user?.name || 'de nuevo'}!
              </h2>
              <p className="text-white/70 text-sm font-medium animate-pulse-soft">
                Preparando tu sesión...
              </p>
            </motion.div>

            {/* Decoraciones flotantes de fondo */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-white/20 rounded-full blur-[1px] animate-float" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-[25%] right-[20%] w-4 h-4 bg-white/10 rounded-full blur-[2px] animate-float" style={{ animationDelay: '1.2s' }} />
              <div className="absolute top-[60%] left-[80%] w-2 h-2 bg-white/30 rounded-full blur-[0.5px] animate-float" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
