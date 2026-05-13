import { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
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
  const { selectedBranch } = useAppSelector((s) => s.auth);
  const { items: stockItems, loading: stockLoading } = useAppSelector((s) => s.stock);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const branchId = selectedBranch?.id || null;

  useEffect(() => {
    if (branchId) {
      dispatch(fetchStock(branchId));
      setCart([]);
    }
  }, [branchId, dispatch]);

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

  const cashNum = parseFloat(cashAmount) || 0;
  const debitNum = parseFloat(debitAmount) || 0;
  const splitValid = splitPayment ? Math.abs(cashNum + debitNum - total) < 0.01 && cashNum > 0 && debitNum > 0 : true;

  const handleCashChange = (val: string) => {
    setCashAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= total) {
      setDebitAmount((total - num).toFixed(2));
    }
  };

  const handleDebitChange = (val: string) => {
    setDebitAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= total) {
      setCashAmount((total - num).toFixed(2));
    }
  };

  useEffect(() => {
    if (splitPayment && total > 0) {
      setCashAmount('');
      setDebitAmount('');
    }
  }, [splitPayment, total]);

  const handleSubmitSale = async () => {
    if (!branchId || cart.length === 0) return;
    if (splitPayment && !splitValid) {
      toast.error('Los montos deben sumar el total');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        branchId,
        paymentMethod: splitPayment ? 'MIXTO' : paymentMethod,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
      };
      if (splitPayment) {
        body.payments = [
          { method: 'EFECTIVO', amount: cashNum },
          { method: 'DEBITO', amount: debitNum },
        ];
      }
      await api.post('/sales', body);
      toast.success('Venta registrada');
      setCart([]);
      setSplitPayment(false);
      setCashAmount('');
      setDebitAmount('');
      dispatch(fetchStock(branchId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar venta');
    } finally { setSubmitting(false); }
  };

  const filteredStock = stockItems
    .filter((s) => s.quantity > 0)
    .filter((s) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return s.product?.name.toLowerCase().includes(term) || s.product?.barcode?.toLowerCase().includes(term);
    });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Registrar Venta</h1>
        {selectedBranch ? (
          <p className="text-surface-500 text-sm mt-1">📍 {selectedBranch.name}</p>
        ) : (
          <p className="text-surface-500 text-sm mt-1">Seleccioná una sucursal desde el Dashboard</p>
        )}
      </div>

      {!branchId ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
          <span className="text-5xl block mb-3">💰</span>
          <p className="text-surface-500 font-medium">No hay sucursal seleccionada</p>
          <p className="text-surface-400 text-sm mt-1">Volvé al Dashboard para elegir una sucursal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900">Productos disponibles</h3>
              <span className="text-xs text-surface-400">{filteredStock.length} productos</span>
            </div>
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre o código..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none text-sm transition-colors"
                aria-label="Buscar producto"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {stockLoading ? <Spinner /> : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredStock.length === 0 ? (
                  <p className="text-center text-surface-400 text-sm py-8">
                    {search ? 'No se encontraron productos' : 'Sin stock disponible'}
                  </p>
                ) : filteredStock.map((item) => {
                  const inCart = cart.find((c) => c.productId === item.productId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-100 hover:border-primary-200 transition-colors">
                      <div>
                        <p className="font-medium text-surface-900 text-sm">{item.product?.name}</p>
                        <p className="text-xs text-surface-400">
                          Stock: {item.quantity} · ${item.product?.price.toFixed(2)}
                          {item.product?.barcode && <span className="ml-2 text-surface-300">({item.product.barcode})</span>}
                        </p>
                      </div>
                      <button onClick={() => item.product && addToCart(item.productId, item.product, item.quantity)}
                        disabled={!!inCart && inCart.quantity >= item.quantity}
                        className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 disabled:opacity-40 transition-colors">
                        {inCart ? `(${inCart.quantity})` : '+ Agregar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
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
                        <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-surface-50">−</button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-surface-50">+</button>
                        <button onClick={() => removeFromCart(item.productId)} className="text-red-400 text-xs ml-1 hover:text-red-600">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 space-y-3">
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>

                  {/* Payment mode toggle */}
                  <div className="flex rounded-lg border border-surface-200 overflow-hidden text-sm">
                    <button
                      onClick={() => setSplitPayment(false)}
                      className={`flex-1 py-2 text-center font-medium transition-colors ${!splitPayment ? 'bg-primary-50 text-primary-700 border-r border-surface-200' : 'text-surface-500 hover:bg-surface-50 border-r border-surface-200'}`}
                    >
                      Pago único
                    </button>
                    <button
                      onClick={() => setSplitPayment(true)}
                      className={`flex-1 py-2 text-center font-medium transition-colors ${splitPayment ? 'bg-primary-50 text-primary-700' : 'text-surface-500 hover:bg-surface-50'}`}
                    >
                      Pago mixto
                    </button>
                  </div>

                  {!splitPayment ? (
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="DEBITO">Débito</option>
                      <option value="CREDITO">Crédito</option>
                      <option value="MERCADOPAGO">MercadoPago</option>
                    </select>
                  ) : (
                    <div className="space-y-2 p-3 rounded-xl bg-surface-50 border border-surface-100">
                      <p className="text-xs font-medium text-surface-600 mb-2">Dividir entre efectivo y débito</p>
                      <div>
                        <label className="text-xs text-surface-500">Efectivo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            max={total}
                            step="0.01"
                            value={cashAmount}
                            onChange={(e) => handleCashChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-surface-500">Débito</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            max={total}
                            step="0.01"
                            value={debitAmount}
                            onChange={(e) => handleDebitChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      </div>
                      {cashAmount && debitAmount && !splitValid && (
                        <p className="text-xs text-red-500">Los montos deben sumar ${total.toFixed(2)}</p>
                      )}
                      {splitValid && cashAmount && debitAmount && (
                        <p className="text-xs text-green-600">Efectivo ${cashNum.toFixed(2)} + Débito ${debitNum.toFixed(2)}</p>
                      )}
                    </div>
                  )}

                  <button onClick={handleSubmitSale} disabled={submitting || (splitPayment && !splitValid)}
                    className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity">
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
