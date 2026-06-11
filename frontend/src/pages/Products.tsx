import { useEffect, useState } from 'react';
import api from '../services/api';
import { Product, Category } from '../types';
import Spinner from '../components/Spinner';
import { SkeletonTable } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useAppSelector } from '../hooks/useAppSelector';
import { Package, Search, Plus, Edit2, Trash2, Flame, LayoutGrid, List } from 'lucide-react';

export default function Products() {
  const { user, selectedBranch } = useAppSelector((state) => state.auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filter and Layout states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [salesCounts, setSalesCounts] = useState<Record<number, number>>({});

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
  }, [selectedBranch]);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);

      if (selectedBranch) {
        try {
          const salesRes = await api.get(`/sales/branch/${selectedBranch.id}`);
          const salesData = salesRes.data || [];
          const counts: Record<number, number> = {};
          salesData.forEach((sale: any) => {
            if (sale.items) {
              sale.items.forEach((item: any) => {
                counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
              });
            }
          });
          setSalesCounts(counts);
        } catch (err) {
          console.error('Error al cargar ventas de sucursal:', err);
        }
      } else {
        setSalesCounts({});
      }
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

  // Filter & Sort products in memory
  const filteredAndSortedProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCatId === '' || p.categoryId === parseInt(selectedCatId);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'sold_desc') {
        const soldA = salesCounts[a.id] || 0;
        const soldB = salesCounts[b.id] || 0;
        return soldB - soldA;
      }
      if (sortBy === 'sold_asc') {
        const soldA = salesCounts[a.id] || 0;
        const soldB = salesCounts[b.id] || 0;
        return soldA - soldB;
      }
      // default: name asc
      return a.name.localeCompare(b.name);
    });

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
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Control and Filter Bar */}
      <div className="bg-white border border-surface-200/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Search & Category */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-surface-50/50"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort & View Switching */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t border-surface-100 md:border-t-0 pt-3 md:pt-0">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-surface-400 uppercase tracking-wider hidden sm:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white cursor-pointer"
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              {selectedBranch && <option value="sold_desc">Más vendidos</option>}
              {selectedBranch && <option value="sold_asc">Menos vendidos</option>}
            </select>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-surface-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-surface-400 hover:text-surface-700'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-surface-400 hover:text-surface-700'
              }`}
              title="Vista de Lista"
            >
              <List size={16} />
            </button>
          </div>
        </div>
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

      {/* Products list/grid */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100 shadow-sm flex flex-col items-center justify-center">
          <Package size={48} className="text-surface-300 mb-3" />
          <p className="text-surface-500 font-medium">No hay productos registrados</p>
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100 shadow-sm flex flex-col items-center justify-center">
          <Search size={48} className="text-surface-300 mb-3" />
          <p className="text-surface-500 font-medium">No se encontraron productos coincidentes</p>
          <p className="text-xs text-surface-400 mt-1">Probá cambiando los términos de búsqueda o filtros.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {filteredAndSortedProducts.map((p) => {
            const soldCount = salesCounts[p.id] || 0;
            return (
              <div
                key={p.id}
                className="bg-white border border-surface-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Image section */}
                <div className="relative aspect-[4/3] w-full bg-surface-50 border-b border-surface-100 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Package size={24} className="text-surface-300" />
                  )}
                  {/* Category Pill */}
                  <span className="absolute top-1.5 left-1.5 text-[7.5px] font-bold bg-white/90 backdrop-blur-sm border border-surface-200/60 px-1 py-0.5 rounded-full uppercase tracking-wider text-surface-600">
                    {p.category?.name || 'Varios'}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                  <div>
                    <h3 className="font-bold text-xs text-surface-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[9.5px] text-surface-400 mt-0.5 line-clamp-1 min-h-[0.75rem]">
                      {p.description || 'Sin descripción.'}
                    </p>
                  </div>

                  {/* Metadata: Price & Sales */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-surface-100/80">
                    <div>
                      <p className="text-[7px] font-bold text-surface-400 uppercase tracking-wider">Precio</p>
                      <p className="text-[11px] font-extrabold text-emerald-600">
                        ${p.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {selectedBranch && (
                      <div className="text-right">
                        <p className="text-[7px] font-bold text-surface-400 uppercase tracking-wider">Venta</p>
                        <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${
                          soldCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-surface-100 text-surface-500'
                        }`}>
                          {soldCount} u
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions (Admin/Empleado only) */}
                {canEdit && (
                  <div className="px-2.5 py-1.5 bg-surface-50/50 border-t border-surface-100 flex items-center justify-end gap-2.5 shrink-0">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-[9.5px] font-bold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-[9.5px] font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
                  {selectedBranch && <th className="text-left px-6 py-3 font-medium text-surface-500">Ventas</th>}
                  <th className="text-left px-6 py-3 font-medium text-surface-500 hidden md:table-cell">Código</th>
                  {canEdit && <th className="text-right px-6 py-3 font-medium text-surface-500">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.map((product) => {
                  const soldCount = salesCounts[product.id] || 0;
                  return (
                    <tr key={product.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-100 border border-surface-200/50 flex items-center justify-center overflow-hidden shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-surface-400" />
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
                      {selectedBranch && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            soldCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-surface-100 text-surface-500'
                          }`}>
                            {soldCount > 0 && <Flame size={10} className="fill-amber-500 stroke-amber-600" />}
                            {soldCount} vendidos
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 hidden md:table-cell text-surface-400 font-mono text-xs">
                        {product.barcode || '—'}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
                            aria-label={`Editar ${product.name}`}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
                            aria-label={`Eliminar ${product.name}`}>
                            Eliminar
                          </button>
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
