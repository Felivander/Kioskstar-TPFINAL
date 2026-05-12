import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex gradient-hero items-center justify-center px-6">
        <div className="glass rounded-3xl shadow-2xl text-center animate-fade-in-up" style={{ padding: '2.5rem' }}>
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Enlace inválido</h2>
          <p className="text-surface-500 text-sm mb-6">Este enlace de recuperación no es válido o ha expirado.</p>
          <Link to="/forgot-password" className="text-primary-600 font-semibold text-sm hover:text-primary-700 transition-colors">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 animate-fade-in-up">
            <span className="text-5xl block mb-3 animate-float">🔐</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Kiosk<span className="text-primary-300">Star</span>
            </h1>
          </div>

          <div className="glass rounded-3xl shadow-2xl animate-fade-in-up delay-1" style={{ padding: '2.5rem' }}>
            {success ? (
              <div className="text-center space-y-4">
                <span className="text-5xl block">✅</span>
                <h2 className="text-xl font-bold text-surface-900">Contraseña actualizada</h2>
                <p className="text-surface-500 text-sm">Ya podés ingresar con tu nueva contraseña.</p>
                <Link
                  to="/login"
                  className="inline-block mt-4 rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  style={{ padding: '0.875rem 2rem' }}
                >
                  Ir al login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-surface-900 mb-1">Nueva contraseña</h2>
                <p className="text-surface-500 text-sm mb-8">Ingresá tu nueva contraseña</p>

                {error && (
                  <div role="alert" className="mb-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-scale-in" style={{ padding: '0.75rem 1rem' }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-surface-700 mb-1.5">Nueva contraseña</label>
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                      style={{ padding: '0.875rem 1rem' }}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-surface-700 mb-1.5">Confirmar contraseña</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                      style={{ padding: '0.875rem 1rem' }}
                      placeholder="Repetí la contraseña"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    {loading ? <Spinner size="sm" /> : 'Restablecer contraseña'}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-surface-100 text-center">
                  <Link to="/login" className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                    ← Volver al login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
