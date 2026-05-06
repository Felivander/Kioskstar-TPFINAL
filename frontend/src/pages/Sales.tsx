import { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchKiosks, fetchBranches } from '../store/kioskSlice';
import { fetchStock } from '../store/stockSlice';
import Spinner from '../components/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Product } from '../types';

interface CartItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

export default function Sales() {
  const dispatch = useAppDispatch();
  const { kiosks, branches } = useAppSelector((s) => s.kiosks);
  const { items: stockItems, loading: stockLoading } = useAppSelector((s) => s.stock);
  const [selectedKiosk, setSelectedKiosk] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { dispatch(fetchKiosks()); }, [dispatch]);
  useEffect(() => { if (selectedKiosk) { dispatch(fetchBranches(selectedKiosk)); setSelectedBranch(null); setCart([]); } }, [selectedKiosk, dispatch]);
  useEffect(() => { if (selectedBranch) { dispatch(fetchStock(selectedBranch)); setCart([]); } }, [selectedBranch, dispatch]);

  const addToCart = (productId: number, product: Product, maxQty: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((c) => c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId, name: product.name, unitPrice: product.price, quantity: 1, maxQuantity: maxQty }];
    });
  };

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((c) => c.productId !== productId));
  const updateCartQty = (productId: number, qty: number) => {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) => prev.map((c) => c.productId === productId ? { ...c, quantity: Math.min(qty, c.maxQuantity) } : c));
  };

  const total = cart.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);

  const handleSubmitSale = async () => {
    if (!selectedBranch || cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.post('/sales', {
        branchId: selectedBranch, paymentMethod,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
      });
      toast.success('Venta registrada');
      setCart([]);
      dispatch(fetchStock(selectedBranch));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar venta');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-surface-900">Registrar Venta</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sale-kiosk" className="block text-sm font-medium text-surface-700 mb-1">Kiosco</label>
          <select id="sale-kiosk" value={selectedKiosk || ''} onChange={(e) => setSelectedKiosk(Number(e.target.value) || null)}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm">
            <option value="">Seleccionar...</option>
            {kiosks.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sale-branch" className="block text-sm font-medium text-surface-700 mb-1">Sucursal</label>
          <select id="sale-branch" value={selectedBranch || ''} onChange={(e) => setSelectedBranch(Number(e.target.value) || null)}
            disabled={!selectedKiosk} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:opacity-50">
            <option value="">Seleccionar...</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedBranch ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <span className="text-5xl block mb-3">💰</span>
          <p className="text-surface-500">Seleccioná kiosco y sucursal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 p-5 shadow-sm">
            <h3 className="font-semibold text-surface-900 mb-4">Productos disponibles</h3>
            {stockLoading ? <Spinner /> : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {stockItems.filter((s) => s.quantity > 0).map((item) => {
                  const inCart = cart.find((c) => c.productId === item.productId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-100 hover:border-primary-200 transition-colors">
                      <div>
                        <p className="font-medium text-surface-900 text-sm">{item.product?.name}</p>
                        <p className="text-xs text-surface-400">Stock: {item.quantity} · ${item.product?.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => item.product && addToCart(item.productId, item.product, item.quantity)}
                        disabled={!!inCart && inCart.quantity >= item.quantity}
                        className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 disabled:opacity-40">
                        {inCart ? `(${inCart.quantity})` : '+ Agregar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-5 shadow-sm flex flex-col">
            <h3 className="font-semibold text-surface-900 mb-4">🛒 Carrito</h3>
            {cart.length === 0 ? <p className="text-surface-400 text-sm text-center py-8">Agregá productos</p> : (
              <>
                <div className="space-y-3 flex-1">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-surface-400">${item.unitPrice.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center">−</button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center">+</button>
                        <button onClick={() => removeFromCart(item.productId)} className="text-red-400 text-xs ml-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 space-y-3">
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="DEBITO">Débito</option>
                    <option value="CREDITO">Crédito</option>
                    <option value="MERCADOPAGO">MercadoPago</option>
                  </select>
                  <button onClick={handleSubmitSale} disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Spinner size="sm" /> : 'Registrar Venta'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
