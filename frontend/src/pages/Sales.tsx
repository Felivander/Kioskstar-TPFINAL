import { useEffect, useState, FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchStock } from '../store/stockSlice';
import { fetchActiveSession, openCashSession, closeCashSession, fetchSessionHistory, clearSessionError } from '../store/cashSessionSlice';
import Spinner from '../components/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Product } from '../types';
import { Flame, Search, Trash2, Calendar, Lock, Unlock, DollarSign } from 'lucide-react';

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

interface TopProduct {
  product: Product;
  totalSold: number;
  salesCount: number;
}

export default function Sales() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { selectedBranch } = useAppSelector((s) => s.auth);
  const { items: stockItems, loading: stockLoading } = useAppSelector((s) => s.stock);
  const { activeSession, history, loading: sessionLoading, error: sessionError } = useAppSelector((s) => s.cashSessions);

  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');

  // Register state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Opening session state
  const [openingBalance, setOpeningBalance] = useState('');

  // Closing session / Arqueo state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10];
  const [billCounts, setBillCounts] = useState<Record<number, string>>({
    20000: '', 10000: '', 2000: '', 1000: '', 500: '', 200: '', 100: '', 50: '', 20: '', 10: ''
  });

  // Trending
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [trending, setTrending] = useState<TopProduct[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const branchId = selectedBranch?.id || null;

  // Sync initial active tab from Dashboard state
  useEffect(() => {
    if (location.state?.activeTab === 'history') {
      setActiveTab('history');
    }
  }, [location.state]);

  useEffect(() => {
    if (branchId) {
      dispatch(fetchActiveSession(branchId));
      dispatch(fetchStock(branchId));
      loadRanking(branchId);
      setCart([]);
    }
  }, [branchId, dispatch]);

  useEffect(() => {
    if (branchId && activeTab === 'history') {
      dispatch(fetchSessionHistory(branchId));
    }
  }, [branchId, activeTab, dispatch]);

  const loadRanking = async (bId: number) => {
    setRankingLoading(true);
    try {
      const { data } = await api.get(`/sales/branch/${bId}/top-products`);
      setTopProducts(data.topProducts || []);
      setTrending(data.trending || []);
    } catch { /* silent */ }
    setRankingLoading(false);
  };

  const handleOpenCaja = async (e: FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      toast.error('Monto inicial inválido');
      return;
    }
    const result = await dispatch(openCashSession({ branchId, openingBalance: balance }));
    if (openCashSession.fulfilled.match(result)) {
      toast.success('Caja abierta');
      setOpeningBalance('');
      dispatch(fetchStock(branchId));
    }
  };

  // Calcular saldo real sumando el conteo de billetes
  const computedActualBalance = Object.entries(billCounts).reduce((sum, [denom, qty]) => {
    const q = parseInt(qty) || 0;
    return sum + (parseInt(denom) * q);
  }, 0);

  const handleCloseCaja = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    // Convertir billCounts a un formato compatible (solo números enteros) para enviar
    const cashCountPayload: Record<string, number> = {};
    Object.entries(billCounts).forEach(([denom, qty]) => {
      const q = parseInt(qty) || 0;
      if (q > 0) {
        cashCountPayload[denom] = q;
      }
    });

    const result = await dispatch(closeCashSession({
      sessionId: activeSession.id,
      actualBalance: computedActualBalance,
      notes: closingNotes,
      cashCount: cashCountPayload,
    }));
    if (closeCashSession.fulfilled.match(result)) {
      toast.success('Caja cerrada con éxito');
      setShowCloseModal(false);
      setBillCounts({ 20000: '', 10000: '', 2000: '', 1000: '', 500: '', 200: '', 100: '', 50: '', 20: '', 10: '' });
      setClosingNotes('');
      if (branchId) dispatch(fetchActiveSession(branchId));
    }
  };

  const addToCart = (pId: number, product: Product, maxStock: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === pId);
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        return prev.map((item) =>
          item.productId === pId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: pId,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          maxStock,
        },
      ];
    });
  };

  const updateCartQty = (pId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(pId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === pId
          ? { ...item, quantity: Math.min(qty, item.maxStock) }
          : item
      )
    );
  };

  const removeFromCart = (pId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== pId));
  };

  const handleCashChange = (val: string) => {
    setCashAmount(val);
    const num = parseFloat(val) || 0;
    const remaining = total - num;
    setDebitAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const handleDebitChange = (val: string) => {
    setDebitAmount(val);
    const num = parseFloat(val) || 0;
    const remaining = total - num;
    setCashAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cashNum = parseFloat(cashAmount) || 0;
  const debitNum = parseFloat(debitAmount) || 0;
  const splitValid = Math.abs(cashNum + debitNum - total) < 0.01;

  const handleSubmitSale = async () => {
    if (!branchId || cart.length === 0) return;
    setSubmitting(true);
    try {
      const body = {
        branchId,
        paymentMethod: splitPayment ? 'MIXTO' : paymentMethod,
        payments: splitPayment
          ? [
              { method: 'EFECTIVO', amount: cashNum },
              { method: 'DEBITO', amount: debitNum },
            ]
          : undefined,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
      };
      await api.post('/sales', body);
      toast.success('Venta registrada');
      setCart([]);
      setSplitPayment(false);
      setCashAmount('');
      setDebitAmount('');
      dispatch(fetchStock(branchId));
      if (branchId) dispatch(fetchActiveSession(branchId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al procesar la venta');
    }
    setSubmitting(false);
  };

  const filteredStock = stockItems.filter((item) =>
    item.product?.name.toLowerCase().includes(search.toLowerCase()) ||
    item.product?.barcode?.includes(search)
  );

  // Expected balance calculation for display in close modal
  const cashSalesTotal = activeSession?.sales?.reduce((sum, sale) => {
    if (sale.paymentMethod === 'EFECTIVO') {
      return sum + sale.total;
    } else if (sale.paymentMethod === 'MIXTO' && Array.isArray(sale.payments)) {
      const cashPay = sale.payments.find((p: any) => p.method === 'EFECTIVO');
      return sum + (cashPay ? cashPay.amount : 0);
    }
    return sum;
  }, 0) || 0;
  
  const expectedBalance = (activeSession?.openingBalance || 0) + cashSalesTotal;

  // Render logic

  if (!branchId) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Registrar Venta</h1>
          <p className="text-surface-500 text-sm mt-1">Seleccioná una sucursal desde el Dashboard</p>
        </div>
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-100 shadow-sm">
          <span className="text-5xl block mb-3">💰</span>
          <p className="text-surface-500 font-medium">No hay sucursal seleccionada</p>
          <p className="text-surface-400 text-sm mt-1">Volvé al Dashboard para elegir una sucursal</p>
        </div>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="max-w-md mx-auto my-12 animate-fade-in-up">
        <div className="bg-white rounded-2xl border border-surface-100 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900">Apertura de Caja</h2>
            <p className="text-surface-500 text-sm mt-1">
              Para registrar ventas en <strong className="text-surface-700">{selectedBranch?.name}</strong>, primero debés abrir la caja con un saldo inicial.
            </p>
          </div>

          <form onSubmit={handleOpenCaja} className="space-y-4">
            <div>
              <label htmlFor="openingBalance" className="block text-sm font-medium text-surface-700 mb-2">
                Saldo Inicial en Efectivo
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-semibold text-lg">$</span>
                <input
                  id="openingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-lg transition-all"
                />
              </div>
            </div>

            {sessionError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center justify-between animate-shake">
                <span>{sessionError}</span>
                <button
                  type="button"
                  onClick={() => dispatch(clearSessionError())}
                  className="text-red-500 hover:text-red-700 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={sessionLoading}
              className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:opacity-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              {sessionLoading ? <Spinner size="sm" /> : (
                <>
                  <Unlock className="w-4 h-4" />
                  Abrir Caja
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header and Branch Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Registrar Venta</h1>
          {selectedBranch && (
            <p className="text-surface-500 text-sm mt-1">📍 {selectedBranch.name}</p>
          )}
        </div>
      </div>

      {/* Session indicator panel */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-surface-900">Caja #{activeSession.id} Abierta</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse">
                En Curso
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-0.5">
              Abierta por <span className="font-semibold text-surface-700">{activeSession.openedBy?.name}</span> el {new Date(activeSession.openedAt).toLocaleString()} · Saldo Inicial: <span className="font-semibold text-surface-700">${activeSession.openingBalance.toFixed(2)}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            dispatch(clearSessionError());
            setShowCloseModal(true);
          }}
          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-650 font-bold text-sm hover:bg-red-50 transition-colors flex items-center gap-2 shrink-0 justify-center cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          Cerrar Caja
        </button>
      </div>

      {/* Trending & Top Products */}
      {(trending.length > 0 || topProducts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trending this week */}
          {trending.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> Trending esta semana
              </h3>
              <div className="space-y-2">
                {trending.map((t, i) => (
                  <div key={t.product.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                      ${i === 0 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md' :
                        i === 1 ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white' :
                        i === 2 ? 'bg-gradient-to-br from-yellow-300 to-amber-400 text-white' :
                        'bg-surface-100 text-surface-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{t.product.name}</p>
                      <p className="text-xs text-surface-400">{t.product.category?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-surface-900">{t.totalSold}</p>
                      <p className="text-[10px] text-surface-400">vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All-time top products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
                <span>🏆</span> Más vendidos (histórico)
              </h3>
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((t, i) => (
                  <div key={t.product.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                      ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md' :
                        i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                        i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                        'bg-surface-100 text-surface-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{t.product.name}</p>
                      <p className="text-xs text-surface-400">{t.salesCount} ventas</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-surface-900">{t.totalSold}</p>
                      <p className="text-[10px] text-surface-400">unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {rankingLoading && (
        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Productos disponibles</h3>
            <span className="text-xs text-surface-400">{filteredStock.length} productos</span>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none text-sm transition-colors"
              aria-label="Buscar producto"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer">
                ✕
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
                      disabled={item.quantity <= 0 || (!!inCart && inCart.quantity >= item.quantity)}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 disabled:opacity-40 transition-colors cursor-pointer">
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
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <span>🛒</span> Carrito
          </h3>
          {cart.length === 0 ? <p className="text-surface-400 text-sm text-center py-8">Agregá productos</p> : (
            <>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px]">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-surface-400">${item.unitPrice.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-surface-50 cursor-pointer">−</button>
                      <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-surface-50 cursor-pointer">+</button>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-400 text-xs ml-1 hover:text-red-650 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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
                    className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${!splitPayment ? 'bg-primary-50 text-primary-700 border-r border-surface-200' : 'text-surface-500 hover:bg-surface-50 border-r border-surface-200'}`}
                  >
                    Pago único
                  </button>
                  <button
                    onClick={() => setSplitPayment(true)}
                    className={`flex-1 py-2 text-center font-medium transition-colors cursor-pointer ${splitPayment ? 'bg-primary-50 text-primary-700' : 'text-surface-500 hover:bg-surface-50'}`}
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
                  className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity cursor-pointer">
                  {submitting ? <Spinner size="sm" /> : 'Registrar Venta'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CLOSE CAJA MODAL (WITH DETAILED ARQUEO BILL COUNTER) */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-surface-200/60 w-full max-w-4xl p-6 shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center pb-3 border-b border-surface-100 mb-4">
              <h3 className="text-lg font-bold text-surface-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" /> Cierre y Arqueo de Caja #{activeSession.id}
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-surface-400 hover:text-surface-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            {sessionError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                ⚠️ {sessionError}
              </div>
            )}

            <form onSubmit={handleCloseCaja} className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
              {/* Planilla de Arqueo (Billetes) */}
              <div className="md:col-span-3 space-y-3">
                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider">Planilla de Arqueo Físico</h4>
                <p className="text-[10px] text-surface-400 -mt-1.5">Ingresá la cantidad de billetes contados por denominación.</p>
                
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {DENOMINATIONS.map((denom) => {
                    const count = parseInt(billCounts[denom]) || 0;
                    const subtotal = count * denom;
                    return (
                      <div key={denom} className="flex items-center justify-between p-2 rounded-xl bg-surface-50 border border-surface-150">
                        <span className="text-xs font-bold text-surface-800 w-20">${denom.toLocaleString()}</span>
                        <input
                          type="number"
                          min="0"
                          value={billCounts[denom]}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseInt(val) >= 0)) {
                              setBillCounts(prev => ({ ...prev, [denom]: val }));
                              dispatch(clearSessionError());
                            }
                          }}
                          placeholder="0"
                          className="w-20 text-center px-2 py-1 rounded-lg border border-surface-200 bg-white font-bold text-xs outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <span className="text-xs font-bold text-surface-600 text-right w-24">${subtotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen de Arqueo */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="bg-surface-50/50 border border-surface-200/50 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Resultado</h4>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold text-surface-500">
                      <span>Saldo Inicial</span>
                      <span>${activeSession.openingBalance.toFixed(2)}</span>
                    </div>
                    {/* Nota: En la vida real el backend calculará el esperado, pero mostramos una previsualización */}
                    <div className="flex justify-between font-semibold text-surface-500 pb-1.5 border-b border-surface-150">
                      <span>Efectivo Esperado</span>
                      <span className="text-surface-700 font-bold">
                        ${expectedBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-extrabold text-surface-900 pt-1">
                      <span>Total Contado</span>
                      <span className="text-primary-600">${computedActualBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-surface-500 pt-1">
                      <span>Diferencia</span>
                      <span className={`font-bold ${computedActualBalance - expectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(computedActualBalance - expectedBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-surface-700">
                    Notas de Cierre (Opcional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Diferencias detectadas, observaciones de turnos, etc..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-surface-200 text-surface-600 font-bold text-xs hover:bg-surface-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-500/10"
                  >
                    Confirmar Cierre
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

