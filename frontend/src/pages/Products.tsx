import { useEffect, useState } from 'react';
import api from '../services/api';
import { Product, Category } from '../types';
import Spinner from '../components/Spinner';
import { SkeletonTable } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useAppSelector } from '../hooks/useAppSelector';

export default function Products() {
  const { user } = useAppSelector((state) => state.auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const canEdit = user?.role === 'ADMIN' || user?.role === 'EMPLEADO';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setBarcode(''); setCategoryId(''); setPrice(''); setDescription(''); setImageUrl('');
    setEditingId(null); setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setName(product.name);
    setBarcode(product.barcode || '');
    setCategoryId(String(product.categoryId));
    setPrice(String(product.price));
    setDescription(product.description || '');
    setImageUrl(product.imageUrl || '');
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      name,
      barcode: barcode || undefined,
      categoryId: parseInt(categoryId),
      price: parseFloat(price),
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', payload);
        toast.success('Producto creado');
      }
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto eliminado');
      loadData();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Productos</h1>
          <p className="text-surface-500 text-sm mt-1">{products.length} productos registrados</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
          >
            + Nuevo Producto
          </button>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => resetForm()}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={editingId ? 'Editar producto' : 'Nuevo producto'}
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="prod-name" className="block text-sm font-medium text-surface-700 mb-1">Nombre *</label>
                <input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-barcode" className="block text-sm font-medium text-surface-700 mb-1">Código de barras</label>
                  <input id="prod-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                </div>
                <div>
                  <label htmlFor="prod-price" className="block text-sm font-medium text-surface-700 mb-1">Precio *</label>
                  <input id="prod-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="prod-cat" className="block text-sm font-medium text-surface-700 mb-1">Categoría *</label>
                <select id="prod-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm">
                  <option value="">Seleccionar...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prod-desc" className="block text-sm font-medium text-surface-700 mb-1">Descripción</label>
                <textarea id="prod-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none" />
              </div>
              <div>
                <label htmlFor="prod-image" className="block text-sm font-medium text-surface-700 mb-1">URL de la Imagen</label>
                <input id="prod-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-surface-200 text-surface-600 font-medium text-sm hover:bg-surface-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {formLoading ? <Spinner size="sm" /> : editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products table */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <span className="text-5xl block mb-3">📦</span>
          <p className="text-surface-500">No hay productos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="text-left px-6 py-3 font-medium text-surface-500">Producto</th>
                  <th className="text-left px-6 py-3 font-medium text-surface-500 hidden sm:table-cell">Categoría</th>
                  <th className="text-left px-6 py-3 font-medium text-surface-500">Precio</th>
                  <th className="text-left px-6 py-3 font-medium text-surface-500 hidden md:table-cell">Código</th>
                  {canEdit && <th className="text-right px-6 py-3 font-medium text-surface-500">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-100 border border-surface-200/50 flex items-center justify-center overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-surface-400 mt-0.5 truncate max-w-[200px]">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
                        {product.category?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-surface-900">
                      ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-surface-400 font-mono text-xs">
                      {product.barcode || '—'}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                          aria-label={`Editar ${product.name}`}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:text-red-600 font-medium transition-colors"
                          aria-label={`Eliminar ${product.name}`}>
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
