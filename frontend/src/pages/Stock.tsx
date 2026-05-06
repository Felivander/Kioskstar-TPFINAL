import { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchKiosks, fetchBranches } from '../store/kioskSlice';
import { fetchStock } from '../store/stockSlice';
import { SkeletonTable } from '../components/Skeleton';
import Spinner from '../components/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Stock() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { kiosks, branches, loading: kioskLoading } = useAppSelector((s) => s.kiosks);
  const { items, loading: stockLoading } = useAppSelector((s) => s.stock);

  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'EMPLEADO';

  useEffect(() => {
    dispatch(fetchKiosks());
  }, [dispatch]);

  useEffect(() => {
    if (selectedKiosk) {
      dispatch(fetchBranches(selectedKiosk));
      setSelectedBranch(null);
    }
  }, [selectedKiosk, dispatch]);

  useEffect(() => {
    if (selectedBranch) {
      dispatch(fetchStock(selectedBranch));
    }
  }, [selectedBranch, dispatch]);

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    if (!selectedBranch || newQuantity < 0) return;
    setUpdatingId(productId);
    try {
      await api.put(`/branches/${selectedBranch}/stock/${productId}`, { quantity: newQuantity });
      dispatch(fetchStock(selectedBranch));
      toast.success('Stock actualizado');
    } catch {
      toast.error('Error al actualizar stock');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Stock por Sucursal</h1>
        <p className="text-surface-500 text-sm mt-1">Seleccioná un kiosco y sucursal para ver el stock</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="stock-kiosk" className="block text-sm font-medium text-surface-700 mb-1">Kiosco</label>
          <select
            id="stock-kiosk"
            value={selectedKiosk || ''}
            onChange={(e) => setSelectedKiosk(Number(e.target.value) || null)}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">Seleccionar kiosco...</option>
            {kiosks.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="stock-branch" className="block text-sm font-medium text-surface-700 mb-1">Sucursal</label>
          <select
            id="stock-branch"
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(Number(e.target.value) || null)}
            disabled={!selectedKiosk}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm disabled:opacity-50"
          >
            <option value="">Seleccionar sucursal...</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
          </select>
        </div>
      </div>

      {/* Stock table */}
      {!selectedBranch ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <span className="text-5xl block mb-3">🏪</span>
          <p className="text-surface-500">Seleccioná un kiosco y sucursal para ver el stock</p>
        </div>
      ) : stockLoading ? (
        <SkeletonTable rows={6} />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <span className="text-5xl block mb-3">📦</span>
          <p className="text-surface-500">No hay stock cargado en esta sucursal</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="text-left px-6 py-3 font-medium text-surface-500">Producto</th>
                  <th className="text-left px-6 py-3 font-medium text-surface-500 hidden sm:table-cell">Categoría</th>
                  <th className="text-center px-6 py-3 font-medium text-surface-500">Cantidad</th>
                  <th className="text-center px-6 py-3 font-medium text-surface-500">Estado</th>
                  {canEdit && <th className="text-center px-6 py-3 font-medium text-surface-500">Ajustar</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.quantity <= 5;
                  const isOut = item.quantity === 0;
                  return (
                    <tr key={item.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-surface-900">
                        {item.product?.name || `Producto #${item.productId}`}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
                          {item.product?.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-lg">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                          ${isOut ? 'bg-red-50 text-red-700' : isLow ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {isOut ? 'Sin stock' : isLow ? 'Bajo' : 'OK'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={updatingId === item.productId || item.quantity <= 0}
                              className="w-8 h-8 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-100 flex items-center justify-center transition-colors disabled:opacity-40"
                              aria-label={`Reducir stock de ${item.product?.name}`}
                            >
                              −
                            </button>
                            {updatingId === item.productId ? (
                              <Spinner size="sm" />
                            ) : (
                              <span className="w-8 text-center font-mono">{item.quantity}</span>
                            )}
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              disabled={updatingId === item.productId}
                              className="w-8 h-8 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-100 flex items-center justify-center transition-colors disabled:opacity-40"
                              aria-label={`Aumentar stock de ${item.product?.name}`}
                            >
                              +
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
