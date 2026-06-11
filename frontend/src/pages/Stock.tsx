import { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchStock } from '../store/stockSlice';
import { SkeletonTable } from '../components/Skeleton';
import Spinner from '../components/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Product } from '../types';
import { Store, Package, MapPin } from 'lucide-react';

export default function Stock() {
  const dispatch = useAppDispatch();
  const { user, selectedBranch } = useAppSelector((s) => s.auth);
  const { items, loading: stockLoading } = useAppSelector((s) => s.stock);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Add product to stock
  const [showAddForm, setShowAddForm] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'EMPLEADO';
  const branchId = selectedBranch?.id || null;

  useEffect(() => {
    if (branchId) {
      dispatch(fetchStock(branchId));
    }
  }, [branchId, dispatch]);

  // Load all products when add form opens
  useEffect(() => {
    if (showAddForm && allProducts.length === 0) {
      setProductsLoading(true);
      api.get('/products')
        .then(({ data }) => setAllProducts(data))
        .catch(() => toast.error('Error cargando productos'))
        .finally(() => setProductsLoading(false));
    }
  }, [showAddForm]);

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    if (!branchId || newQuantity < 0) return;
    setUpdatingId(productId);
    try {
      await api.put(`/branches/${branchId}/stock/${productId}`, { quantity: newQuantity });
      dispatch(fetchStock(branchId));
      toast.success('Stock actualizado');
    } catch {
      toast.error('Error al actualizar stock');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddProduct = async () => {
    if (!branchId || !selectedProductId || addQuantity < 0) return;
    setAddLoading(true);
    try {
      await api.put(`/branches/${branchId}/stock/${selectedProductId}`, { quantity: addQuantity });
      dispatch(fetchStock(branchId));
      toast.success('Producto agregado al stock');
      setShowAddForm(false);
      setSelectedProductId(null);
      setProductSearch('');
      setAddQuantity(1);
    } catch {
      toast.error('Error al agregar producto');
    } finally {
      setAddLoading(false);
    }
  };

  // Filter out products already in stock
  const existingProductIds = new Set(items.map((i) => i.productId));
  const availableProducts = allProducts.filter(
    (p) => !existingProductIds.has(p.id) &&
      (productSearch === '' ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(productSearch)))
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Stock por Sucursal</h1>
          {selectedBranch ? (
            <p className="text-surface-500 text-sm mt-1 flex items-center gap-1">
              <MapPin size={14} className="text-surface-400 shrink-0" />
              <span>{selectedBranch.name}</span>
            </p>
          ) : (
            <p className="text-surface-500 text-sm mt-1">Seleccioná una sucursal desde el Dashboard</p>
          )}
        </div>
        {canEdit && branchId && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            {showAddForm ? 'Cancelar' : '+ Agregar producto'}
          </button>
        )}
      </div>

      {/* Add product form */}
      {showAddForm && branchId && (
        <div className="bg-white rounded-2xl border border-surface-100 p-5 animate-scale-in shadow-sm">
          <h3 className="text-sm font-bold text-surface-900 mb-3">Agregar producto al stock</h3>
          {productsLoading ? (
            <div className="flex items-center gap-2 py-4 justify-center text-surface-400">
              <Spinner size="sm" /> <span className="text-sm">Cargando productos...</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Product search + select */}
              <div className="flex-1 relative">
                <input
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setSelectedProductId(null); }}
                  placeholder="Buscar producto por nombre o código de barras..."
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 px-4 py-2.5"
                />
                {productSearch && !selectedProductId && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-surface-200 shadow-xl max-h-48 overflow-y-auto">
                    {availableProducts.length === 0 ? (
                      <p className="text-xs text-surface-400 p-3 text-center">No se encontraron productos disponibles</p>
                    ) : (
                      availableProducts.slice(0, 10).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProductId(p.id); setProductSearch(p.name); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors flex items-center justify-between text-sm border-b border-surface-50 last:border-0"
                        >
                          <div>
                            <span className="font-medium text-surface-900">{p.name}</span>
                            {p.barcode && <span className="text-xs text-surface-400 ml-2">#{p.barcode}</span>}
                          </div>
                          <span className="text-xs text-primary-600 font-medium">${p.price}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedProductId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Seleccionado</span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-surface-500 shrink-0">Cantidad:</label>
                <input
                  type="number"
                  min={0}
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                  className="w-20 rounded-xl border border-surface-200 bg-surface-50 text-sm text-center outline-none focus:ring-2 focus:ring-primary-400 px-3 py-2.5"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleAddProduct}
                disabled={addLoading || !selectedProductId || addQuantity < 0}
                className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                {addLoading ? <Spinner size="sm" /> : 'Agregar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stock table */}
      {!branchId ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100 flex flex-col items-center">
          <Store size={48} className="text-surface-400 mb-3" />
          <p className="text-surface-500 font-medium">No hay sucursal seleccionada</p>
          <p className="text-surface-400 text-sm mt-1">Volvé al Dashboard para elegir una sucursal</p>
        </div>
      ) : stockLoading ? (
        <SkeletonTable rows={6} />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100 flex flex-col items-center">
          <Package size={48} className="text-surface-400 mb-3" />
          <p className="text-surface-500">No hay stock cargado en esta sucursal</p>
          {canEdit && (
            <button onClick={() => setShowAddForm(true)} className="mt-3 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              + Agregar primer producto
            </button>
          )}
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
