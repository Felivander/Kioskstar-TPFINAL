import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/8 rounded-full blur-3xl animate-float delay-3" />

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 animate-fade-in-up">
            <span className="text-5xl block mb-3 animate-float">🔑</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Kiosk<span className="text-primary-300">Star</span>
            </h1>
          </div>

          <div className="glass rounded-3xl shadow-2xl animate-fade-in-up delay-1" style={{ padding: '2.5rem' }}>
            {sent ? (
              <div className="text-center space-y-4">
                <span className="text-5xl block">📧</span>
                <h2 className="text-xl font-bold text-surface-900">Revisá tu email</h2>
                <p className="text-surface-500 text-sm leading-relaxed">
                  Si <strong>{email}</strong> está registrado, vas a recibir un enlace para restablecer tu contraseña. Revisá también la carpeta de spam.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-4 text-primary-600 font-semibold text-sm hover:text-primary-700 transition-colors"
                >
                  ← Volver al login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-surface-900 mb-1">¿Olvidaste tu contraseña?</h2>
                <p className="text-surface-500 text-sm mb-8">Ingresá tu email y te enviaremos un enlace de recuperación</p>

                {error && (
                  <div role="alert" className="mb-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-scale-in" style={{ padding: '0.75rem 1rem' }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      required
                      autoComplete="email"
                      className="w-full rounded-2xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder-surface-400 transition-all focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                      style={{ padding: '0.875rem 1rem' }}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{ padding: '0.875rem 1rem' }}
                  >
                    {loading ? <Spinner size="sm" /> : 'Enviar enlace'}
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
