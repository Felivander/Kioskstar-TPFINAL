import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { updateAuthUser, logout } from '../store/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Account() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  
  // Account Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleUpdateName = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    if (name === user?.name) {
      toast.error('El nombre es el mismo que el actual');
      return;
    }

    setLoadingName(true);
    try {
      const { data } = await api.put(`/auth/users/${user?.id}`, { name });
      dispatch(updateAuthUser(data));
      toast.success('Nombre actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando nombre:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar el nombre');
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdateEmailSimulated = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Ingresa un email válido');
      return;
    }
    if (email === user?.email) {
      toast.error('El email es el mismo que el actual');
      return;
    }

    setLoadingEmail(true);
    // Simular retraso de API
    setTimeout(() => {
      // Actualizamos localmente en el estado Redux para feedback visual
      if (user) {
        const updatedUser = { ...user, email };
        dispatch(updateAuthUser(updatedUser));
      }
      toast.success('Email actualizado (Simulado en frontend)');
      setLoadingEmail(false);
    }, 800);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'eliminar') {
      toast.error('Por favor escribe "eliminar" para confirmar');
      return;
    }

    setLoadingDelete(true);
    try {
      await api.delete(`/auth/users/${user?.id}`);
      toast.success('Cuenta eliminada exitosamente');
      dispatch(logout());
      navigate('/register');
    } catch (error: any) {
      console.error('Error al borrar cuenta:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar la cuenta');
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up py-4 px-2">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-surface-950 tracking-tight">Mi Cuenta</h2>
        <p className="text-sm text-surface-500 mt-1">
          Gestioná tus datos personales, preferencias de contacto y tu cuenta de KioskStar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Details Card */}
        <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-surface-900 border-b border-surface-100 pb-3">
            Datos del Perfil
          </h3>

          {/* Form Nombre */}
          <form onSubmit={handleUpdateName} className="space-y-2">
            <label htmlFor="name-input" className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Nombre de Usuario
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresá tu nombre"
                className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all bg-surface-50/50"
              />
              <button
                type="submit"
                disabled={loadingName || name === user?.name}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  name === user?.name
                    ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md'
                }`}
              >
                {loadingName ? 'Guardando...' : 'Guardar Nombre'}
              </button>
            </div>
          </form>

          {/* Form Email */}
          <form onSubmit={handleUpdateEmailSimulated} className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label htmlFor="email-input" className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Dirección de Correo
              </label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Simulado
              </span>
            </div>
            
            <p className="text-xs text-indigo-500 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/50">
              ℹ️ La actualización del email en base de datos está pendiente de implementación en el backend. Los cambios aquí serán simulados localmente.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresá tu correo electrónico"
                className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all bg-surface-50/50"
              />
              <button
                type="submit"
                disabled={loadingEmail || email === user?.email}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  email === user?.email
                    ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                }`}
              >
                {loadingEmail ? 'Actualizando...' : 'Actualizar Email'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-red-50/30 border border-red-200/50 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-red-900">Zona de Peligro</h3>
            <p className="text-sm text-red-700/80 mt-1">
              Las siguientes acciones son destructivas y no se pueden deshacer.
            </p>
          </div>

          <div className="border-t border-red-200/40 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-900">Eliminar Cuenta de KioskStar</h4>
              <p className="text-xs text-red-700/70 max-w-xl">
                Al borrar tu cuenta, se eliminará toda tu información de perfil, tus kioscos registrados, sucursales, stocks de mercadería e historial de ventas registradas. Esta acción es irrevocable.
              </p>
            </div>
            <button
              onClick={() => {
                setDeleteConfirmText('');
                setShowDeleteModal(true);
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer self-start md:self-center"
            >
              Borrar mi Cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeleteModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl border border-surface-200 shadow-2xl p-6 max-w-md w-full z-10 animate-scale-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-surface-950">¿Confirmás la eliminación permanente?</h3>
              <p className="text-sm text-surface-500 mt-2">
                Esta acción eliminará para siempre tu usuario, kioscos, sucursales y ventas asociadas. Escribí <strong className="text-red-600">eliminar</strong> a continuación para confirmar.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Escribí "eliminar"'
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm bg-red-50/10"
              />
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4.5 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loadingDelete || deleteConfirmText.toLowerCase() !== 'eliminar'}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer ${
                  deleteConfirmText.toLowerCase() === 'eliminar'
                    ? 'bg-red-600 hover:bg-red-700 shadow-sm'
                    : 'bg-surface-200 text-surface-400 cursor-not-allowed'
                }`}
              >
                {loadingDelete ? 'Eliminando...' : 'Eliminar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
