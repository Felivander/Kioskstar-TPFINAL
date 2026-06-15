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

      {/* Splashscreen de Bienvenida Cinematográfico */}
      <AnimatePresence>
        {showSplash && (
          <div className="fixed inset-0 z-50 bg-radial from-surface-950 via-surface-900 to-black flex flex-col items-center justify-center text-white overflow-hidden select-none">
            {/* Defs para Gradientes y Filtros SVG */}
            <svg className="w-0 h-0 absolute">
              <defs>
                {/* Degradado lineal para el relleno (Navbar Princeton Orange) */}
                <linearGradient id="neon-star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c2410c" />   {/* Orange 700 */}
                  <stop offset="50%" stopColor="#f97316" />  {/* Orange 500 */}
                  <stop offset="100%" stopColor="#c2410c" /> {/* Orange 700 */}
                </linearGradient>
                {/* Degradado lineal para el contorno brillante */}
                <linearGradient id="neon-stroke-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c" />   {/* Orange 600 */}
                  <stop offset="100%" stopColor="#fb923c" />  {/* Orange 400 */}
                </linearGradient>
              </defs>
            </svg>

            {/* Contenedor Principal de la Estrella Portal */}
            <motion.div
              animate={splashFadeOut ? { scale: 18, rotate: 15, opacity: 0 } : { scale: [1, 1.03, 1] }}
              transition={
                splashFadeOut 
                  ? { type: 'spring', stiffness: 100, damping: 15 } 
                  : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
              }
              className="flex flex-col items-center justify-center relative"
            >
              {/* Estrella SVG con Efecto Dibujo de Contorno y Relleno */}
              <svg 
                viewBox="0 0 24 24" 
                className="w-44 h-44 md:w-56 md:h-56 filter drop-shadow-[0_0_25px_rgba(249,115,22,0.65)]"
                fill="none"
              >
                {/* Trazado de estrella geométrica de 5 puntas */}
                <motion.path
                  d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192L12 .587z"
                  stroke="url(#neon-stroke-gradient)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  
                  // Animación secuencial con Framer Motion
                  initial={{ pathLength: 0, fill: "rgba(249, 115, 22, 0)", fillOpacity: 0 }}
                  animate={{ 
                    pathLength: 1, 
                    fill: "url(#neon-star-gradient)",
                    fillOpacity: 1
                  }}
                  transition={{
                    pathLength: { duration: 1.3, ease: "easeInOut" },
                    fillOpacity: { delay: 1.2, duration: 0.6, ease: "easeIn" },
                    fill: { delay: 1.2, duration: 0.6 }
                  }}
                />
              </svg>

              {/* Logo textual KioskStar */}
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="text-4xl font-extrabold tracking-tight mt-6"
              >
                Kiosk<span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">Star</span>
              </motion.h1>
            </motion.div>

            {/* Separador brillante */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.6, ease: 'easeInOut' }}
              className="w-32 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent my-6 origin-center"
            />

            {/* Bienvenida y Subtítulo */}
            <motion.div
              animate={splashFadeOut ? { y: 35, opacity: 0 } : {}}
              transition={{ duration: 0.4, ease: 'easeIn' }}
              className="text-center flex flex-col items-center gap-1.5"
            >
              <motion.h2 
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7, ease: 'easeOut' }}
                className="text-xl font-bold tracking-tight text-white/95"
              >
                ¡Hola, {user?.name || 'de nuevo'}!
              </motion.h2>
              <motion.p 
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.9, ease: 'easeOut' }}
                className="text-orange-400 text-xs font-semibold uppercase tracking-wider animate-pulse-soft"
              >
                Preparando tu sesión...
              </motion.p>
            </motion.div>

            {/* Decoración ambiental */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-orange-500 rounded-full blur-[1px] animate-float" style={{ animationDelay: '0.2s' }} />
              <div className="absolute bottom-[30%] right-[15%] w-3 h-3 bg-orange-400 rounded-full blur-[2px] animate-float" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
