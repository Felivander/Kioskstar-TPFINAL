import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { registerUser, clearError } from '../store/authSlice';
import Spinner from '../components/Spinner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENTE');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerUser({ name, email, password, role }));
    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const roles = [
    { value: 'CLIENTE', label: 'Cliente', desc: 'Explorá el mapa', icon: '🗺️' },
    { value: 'EMPLEADO', label: 'Empleado', desc: 'Gestioná ventas', icon: '🏪' },
    { value: 'ADMIN', label: 'Admin', desc: 'Control total', icon: '👑' },
  ];

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <span className="text-5xl block mb-3 animate-float">🌟</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Kiosk<span className="text-primary-300">Star</span>
            </h1>
            <p className="text-primary-200/70 mt-2 text-sm">Creá tu cuenta en segundos</p>
          </div>

          {/* Form card */}
          <div
            className="glass rounded-3xl shadow-2xl animate-fade-in-up delay-1"
            style={{ padding: '2rem 2.5rem' }}
          >
            <h2 className="text-2xl font-bold text-surface-900 mb-1">Registro</h2>
            <p className="text-surface-500 text-sm mb-6">Completá tus datos para empezar</p>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-scale-in"
                style={{ padding: '0.75rem 1rem' }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Nombre
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); dispatch(clearError()); }}
                  required
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-surface-700 mb-1.5">
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
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="tu@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-surface-700 mb-1.5">
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
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {/* Role selector */}
              <fieldset>
                <legend className="block text-sm font-medium text-surface-700 mb-2">
                  Tipo de cuenta
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <label
                      key={r.value}
                      className={`cursor-pointer rounded-2xl border-2 text-center transition-all duration-200
                        ${role === r.value
                          ? 'border-primary-400 bg-primary-50 shadow-sm'
                          : 'border-surface-200 bg-white hover:border-surface-300'}`}
                      style={{ padding: '0.75rem 0.5rem' }}
                    >
                      <input type="radio" name="role" value={r.value} checked={role === r.value}
                        onChange={(e) => setRole(e.target.value)} className="sr-only" />
                      <span className="text-xl block mb-1">{r.icon}</span>
                      <span className="text-xs font-semibold text-surface-900 block">{r.label}</span>
                      <span className="text-[10px] text-surface-400 leading-tight block mt-0.5">{r.desc}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                style={{ padding: '0.875rem 1rem' }}
              >
                {loading ? <Spinner size="sm" /> : 'Crear Cuenta'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-surface-100 text-center">
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
