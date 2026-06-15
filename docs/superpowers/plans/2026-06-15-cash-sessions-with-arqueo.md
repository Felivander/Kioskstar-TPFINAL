# Cierre de Caja con Arqueo de Billetes e Historial de Ventas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a strict cash session open/close system (cajas) with an interactive bill count audit (arqueo de caja) and group all sales by session in a collapsible chronological history list.

**Architecture:** Create a `CashSession` model in database with a JSON field for bill counts, validate closing inputs via Zod, manage global state through a Redux slice, lock/unlock checkout screen depending on cash session status, and design a tabbed POS interface showing collapsible cash session history with detailed breakdowns.

**Tech Stack:** React, Redux Toolkit, Tailwind CSS, Express, Prisma, PostgreSQL

---

### Task 1: Database Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Define the CashSession model and update relations**

Open `backend/prisma/schema.prisma` and add the following lines at the bottom of the file:

```prisma
enum CashSessionStatus {
  OPEN
  CLOSED
}

model CashSession {
  id              Int               @id @default(autoincrement())
  branchId        Int
  openedById      Int
  closedById      Int?
  status          CashSessionStatus @default(OPEN)
  openingBalance  Float             // Saldo inicial en efectivo
  expectedBalance Float?            // Saldo esperado (inicial + efectivo ventas)
  actualBalance   Float?            // Saldo real ingresado al cerrar
  cashCount       Json?             // Desglose de billetes: {"20000": 3, "10000": 2, ...}
  notes           String?
  openedAt        DateTime          @default(now())
  closedAt        DateTime?

  branch   Branch  @relation(fields: [branchId], references: [id], onDelete: Cascade)
  openedBy User    @relation("OpenedSessions", fields: [openedById], references: [id])
  closedBy User?   @relation("ClosedSessions", fields: [closedById], references: [id])
  sales    Sale[]

  @@map("cash_sessions")
}
```

Now, update the `User` model to define inverse relations (around line 40):
```prisma
  openedSessions CashSession[] @relation("OpenedSessions")
  closedSessions CashSession[] @relation("ClosedSessions")
```

Update the `Sale` model to include the relation to `CashSession` (around line 140):
```prisma
  cashSessionId Int?
  cashSession   CashSession? @relation(fields: [cashSessionId], references: [id], onDelete: SetNull)
```

Update `Branch` model to define inverse relation to `CashSession` (around line 80):
```prisma
  cashSessions CashSession[]
```

- [ ] **Step 2: Generate and apply the Prisma migration**

In `backend/` directory, run the migration command:
```powershell
npx prisma migrate dev --name add_cash_sessions_with_arqueo
```
Expected: Prisma successfully generates the SQL migration and updates the local database structure, outputs success log.

- [ ] **Step 3: Commit migration files**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "db: add cash session schema with cash count field"
```

---

### Task 2: Backend Zod Schema & Route Registry

**Files:**
- Create: `backend/src/schemas/cash-session.schema.ts`
- Create: `backend/src/routes/cash-session.routes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create Zod validation schema**

Create file `backend/src/schemas/cash-session.schema.ts` with the following content:

```typescript
import { z } from 'zod';

export const openCashSessionSchema = z.object({
  branchId: z.number().int().positive('La sucursal es requerida'),
  openingBalance: z.number().nonnegative('El saldo inicial debe ser mayor o igual a 0'),
});

export const closeCashSessionSchema = z.object({
  sessionId: z.number().int().positive('ID de sesión inválido'),
  actualBalance: z.number().nonnegative('El saldo final debe ser mayor o igual a 0'),
  notes: z.string().max(500, 'Las notas no pueden superar los 500 caracteres').optional(),
  cashCount: z.record(z.string(), z.number().int().nonnegative()).optional(),
});
```

- [ ] **Step 2: Create Routing File**

Create file `backend/src/routes/cash-session.routes.ts` with the following content:

```typescript
import { Router } from 'express';
import { getActiveSession, openSession, closeSession, getHistoryByBranch } from '../controllers/cash-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { openCashSessionSchema, closeCashSessionSchema } from '../schemas/cash-session.schema';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN', 'EMPLEADO'));

router.get('/active/:branchId', getActiveSession);
router.get('/branch/:branchId', getHistoryByBranch);
router.post('/open', validate(openCashSessionSchema), openSession);
router.post('/close', validate(closeCashSessionSchema), closeSession);

export default router;
```

- [ ] **Step 3: Mount CashSession routes in index.ts**

Open `backend/src/index.ts`. Add import:
```typescript
import cashSessionRoutes from './routes/cash-session.routes';
```
And mount it below line 65:
```typescript
app.use('/api/cash-sessions', cashSessionRoutes);
```

- [ ] **Step 4: Commit new files**

```bash
git add backend/src/schemas/cash-session.schema.ts backend/src/routes/cash-session.routes.ts backend/src/index.ts
git commit -m "feat: add cash session Zod schemas and route setup"
```

---

### Task 3: Backend Controller Implementation

**Files:**
- Create: `backend/src/controllers/cash-session.controller.ts`

- [ ] **Step 1: Write controller methods**

Create file `backend/src/controllers/cash-session.controller.ts` and implement the controller logic:

```typescript
import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getActiveSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const active = await prisma.cashSession.findFirst({
      where: {
        branchId: parseInt(branchId),
        status: 'OPEN',
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(active);
  } catch (error) {
    console.error('Error en getActiveSession:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const openSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, openingBalance } = req.body;

    const existing = await prisma.cashSession.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (existing) {
      res.status(400).json({ error: 'Ya existe una caja abierta para esta sucursal' });
      return;
    }

    const session = await prisma.cashSession.create({
      data: {
        branchId,
        openedById: req.userId!,
        openingBalance,
        status: 'OPEN',
      },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error en openSession:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const closeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, actualBalance, notes, cashCount } = req.body;

    const session = await prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: { sales: true },
    });

    if (!session) {
      res.status(404).json({ error: 'Sesión de caja no encontrada' });
      return;
    }
    if (session.status === 'CLOSED') {
      res.status(400).json({ error: 'Esta caja ya está cerrada' });
      return;
    }

    // Calcular el monto en efectivo esperado
    let cashSalesTotal = 0;
    session.sales.forEach((sale) => {
      if (sale.paymentMethod === 'EFECTIVO') {
        cashSalesTotal += sale.total;
      } else if (sale.paymentMethod === 'MIXTO' && sale.payments) {
        try {
          const paymentsArray = sale.payments as any[];
          const cashPayment = paymentsArray.find((p) => p.method === 'EFECTIVO');
          if (cashPayment) {
            cashSalesTotal += cashPayment.amount || 0;
          }
        } catch (e) {
          console.error('Error parsing mixed payment JSON:', e);
        }
      }
    });

    const expectedBalance = session.openingBalance + cashSalesTotal;

    const updated = await prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedById: req.userId!,
        closedAt: new Date(),
        expectedBalance,
        actualBalance,
        cashCount,
        notes,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error en closeSession:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getHistoryByBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const history = await prisma.cashSession.findMany({
      where: { branchId: parseInt(branchId) },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        sales: {
          include: {
            items: { include: { product: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
    res.json(history);
  } catch (error) {
    console.error('Error en getHistoryByBranch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

- [ ] **Step 2: Commit backend controller**

```bash
git add backend/src/controllers/cash-session.controller.ts
git commit -m "feat: implement cash session backend controller logic with cash count saving"
```

---

### Task 4: Hook Active Session Checks on Sale Creation

**Files:**
- Modify: `backend/src/controllers/sale.controller.ts`

- [ ] **Step 1: Check active session in createSale**

Open `backend/src/controllers/sale.controller.ts`. Look at the `createSale` function.
Inject active cash session check and write `cashSessionId` to Prisma create data:

Replace lines 5-42 (or corresponding section):
```typescript
export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, paymentMethod, payments, items } = req.body;

    // Verificar si existe una caja abierta en esta sucursal
    const activeSession = await prisma.cashSession.findFirst({
      where: { branchId, status: 'OPEN' },
    });

    if (!activeSession) {
      res.status(400).json({ error: 'La caja está cerrada. Debe abrir la caja para poder registrar ventas.' });
      return;
    }

    const total = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          branchId,
          userId: req.userId!,
          total,
          paymentMethod,
          payments: paymentMethod === 'MIXTO' ? payments : undefined,
          cashSessionId: activeSession.id,
          items: {
            create: items.map((item: { productId: number; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      });
```

- [ ] **Step 2: Verify compilation and commit**

```bash
git add backend/src/controllers/sale.controller.ts
git commit -m "fix: enforce active cash session validation during sale creation"
```

---

### Task 5: Frontend Redux State Integration

**Files:**
- Create: `frontend/src/store/cashSessionSlice.ts`
- Modify: `frontend/src/store/index.ts`

- [ ] **Step 1: Create cashSession Redux Slice**

Create file `frontend/src/store/cashSessionSlice.ts` with the following content:

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export interface UserSummary {
  id: number;
  name: string;
}

export interface SaleItemSummary {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
}

export interface SaleSummary {
  id: number;
  total: number;
  paymentMethod: string;
  payments: any;
  createdAt: string;
  user: UserSummary;
  items: SaleItemSummary[];
}

export interface CashSession {
  id: number;
  branchId: number;
  openedById: number;
  closedById: number | null;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  expectedBalance: number | null;
  actualBalance: number | null;
  cashCount: any; // Record<string, number> or null
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: UserSummary;
  closedBy?: UserSummary | null;
  sales?: SaleSummary[];
}

interface CashSessionState {
  activeSession: CashSession | null;
  history: CashSession[];
  loading: boolean;
  error: string | null;
}

const initialState: CashSessionState = {
  activeSession: null,
  history: [],
  loading: false,
  error: null,
};

export const fetchActiveSession = createAsyncThunk<CashSession | null, number>(
  'cashSessions/fetchActive',
  async (branchId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<CashSession | null>(`/cash-sessions/active/${branchId}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener caja activa');
    }
  }
);

export const openCashSession = createAsyncThunk<CashSession, { branchId: number; openingBalance: number }>(
  'cashSessions/open',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<CashSession>('/cash-sessions/open', payload);
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error al abrir caja');
    }
  }
);

export const closeCashSession = createAsyncThunk<CashSession, { sessionId: number; actualBalance: number; notes?: string; cashCount?: Record<string, number> }>(
  'cashSessions/close',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<CashSession>('/cash-sessions/close', payload);
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error al cerrar caja');
    }
  }
);

export const fetchSessionHistory = createAsyncThunk<CashSession[], number>(
  'cashSessions/fetchHistory',
  async (branchId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<CashSession[]>(`/cash-sessions/branch/${branchId}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener historial');
    }
  }
);

const cashSessionSlice = createSlice({
  name: 'cashSessions',
  initialState,
  reducers: {
    clearSessionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active
      .addCase(fetchActiveSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Open
      .addCase(openCashSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(openCashSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(openCashSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Close
      .addCase(closeCashSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(closeCashSession.fulfilled, (state) => {
        state.loading = false;
        state.activeSession = null;
      })
      .addCase(closeCashSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch History
      .addCase(fetchSessionHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchSessionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSessionError } = cashSessionSlice.actions;
export default cashSessionSlice.reducer;
```

- [ ] **Step 2: Register cashSession reducer in store**

Open `frontend/src/store/index.ts`. Register it:
```typescript
import cashSessionReducer from './cashSessionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kiosks: kioskReducer,
    stock: stockReducer,
    cashSessions: cashSessionReducer,
  },
});
```

- [ ] **Step 3: Commit Redux updates**

```bash
git add frontend/src/store/cashSessionSlice.ts frontend/src/store/index.ts
git commit -m "feat: add cashSession redux slice and register in store"
```

---

### Task 6: Frontend POS cash count (Arqueo) implementation

**Files:**
- Modify: `frontend/src/pages/Sales.tsx`

- [ ] **Step 1: Check active session on mount & implement checkout blocker**

Open `frontend/src/pages/Sales.tsx`. 
We will read `activeSession` state from `cashSessions` Redux store, and alternate between Checkout Form (if OPEN) and Opening Balance Form (if CLOSED).
We will also add the header bar displaying cash session metadata and the Close Cash drawer button.
We will add a detailed cash count (Arqueo) layout inside the close cash drawer modal.

Replace `Sales.tsx` imports and declarations:
```typescript
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
```

Replace lines 24-150 with CashSession loading, state variables, and handlers. Note that the close cash session state needs `cashCount` record:
```typescript
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
```

Update cart changes, `handleSubmitSale`, and helper functions (e.g., `addToCart`, `updateCartQty`, `removeFromCart`):
```typescript
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
```

- [ ] **Step 2: Commit POS code updates**

```bash
git add frontend/src/pages/Sales.tsx
git commit -m "feat: implement cash session control and sale submission hooks"
```

---

### Task 7: Frontend Tabbed Interface & Sales History view

**Files:**
- Modify: `frontend/src/pages/Sales.tsx`

- [ ] **Step 1: Replace UI render content**

Open `frontend/src/pages/Sales.tsx`. Modify the render return statement to support tabs, cash count inputs, expected balance calculation inside the close modal, and detailed bill desgloses inside the Accordion components.

Replace the return statement of `Sales` component and subcomponents (`AccordionSession`, `AccordionSale`) with the complete POS layout including bill count inputs and historical detailed breakdowns:

```tsx
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Title & Branch selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-950">Ventas y Cajas</h1>
          {selectedBranch ? (
            <p className="text-surface-500 text-sm mt-1">📍 Sucursal: <span className="font-semibold">{selectedBranch.name}</span></p>
          ) : (
            <p className="text-surface-500 text-sm mt-1">Seleccioná una sucursal desde el Dashboard</p>
          )}
        </div>

        {branchId && (
          <div className="flex bg-surface-200/50 p-1 rounded-2xl border border-surface-200/40">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'register' ? 'gradient-primary text-white shadow-md' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Registrar Venta
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history' ? 'gradient-primary text-white shadow-md' : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Historial de Caja
            </button>
          </div>
        )}
      </div>

      {!branchId ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-surface-200/50 shadow-sm">
          <span className="text-5xl block mb-3">💰</span>
          <p className="text-surface-500 font-medium">No hay sucursal seleccionada</p>
          <p className="text-surface-400 text-sm mt-1">Volvé al Dashboard para elegir una sucursal</p>
        </div>
      ) : sessionLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : activeTab === 'register' ? (
        /* TAB: REGISTRAR VENTA */
        !activeSession ? (
          /* CAJA CERRADA: MOSTRAR APERTURA */
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-surface-200/60 p-8 shadow-xl text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-5 text-orange-600">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Caja Cerrada</h2>
            <p className="text-surface-500 text-sm mb-6">Debe abrir la caja indicando el saldo inicial en efectivo para poder registrar ventas.</p>

            {sessionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold text-left">
                ⚠️ {sessionError}
              </div>
            )}

            <form onSubmit={handleOpenCaja} className="space-y-4 text-left">
              <div>
                <label htmlFor="open-balance" className="block text-xs font-semibold text-surface-700 mb-1.5">
                  Efectivo Inicial en Caja ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    id="open-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={openingBalance}
                    onChange={(e) => { setOpeningBalance(e.target.value); dispatch(clearSessionError()); }}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-surface-200 bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-semibold transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl gradient-primary text-white font-bold text-sm shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Abrir Caja
              </button>
            </form>
          </div>
        ) : (
          /* CAJA ABIERTA: INTERFAZ REGISTRO NORMAL */
          <>
            {/* Session Indicator Panel */}
            <div className="bg-white rounded-2xl border border-surface-200/50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <Unlock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-surface-900">Caja #{activeSession.id} Abierta</span>
                    <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Operando</span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Abierta por <span className="font-semibold">{activeSession.openedBy?.name}</span> hoy a las {new Date(activeSession.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs · Saldo Inicial: <span className="font-semibold">${activeSession.openingBalance.toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { dispatch(clearSessionError()); setShowCloseModal(true); }}
                className="px-4 py-2 rounded-xl border-2 border-red-200 hover:border-red-300 bg-red-50/20 hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-center"
              >
                Cerrar Caja
              </button>
            </div>

            {/* Trending & Checkout POS layouts */}
            {(trending.length > 0 || topProducts.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trending.length > 0 && (
                  <div className="bg-white rounded-2xl border border-surface-200/50 p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
                      🔥 Trending esta semana
                    </h3>
                    <div className="space-y-2">
                      {trending.map((t, i) => (
                        <div key={t.product.id} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-50 transition-colors">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                            ${i === 0 ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm' :
                              i === 1 ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white' :
                              i === 2 ? 'bg-gradient-to-br from-yellow-300 to-amber-400 text-white' :
                              'bg-surface-100 text-surface-500'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-surface-800 truncate">{t.product.name}</p>
                            <p className="text-[10px] text-surface-400 capitalize">{t.product.category?.name?.toLowerCase()}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-surface-900">{t.totalSold}</p>
                            <p className="text-[9px] text-surface-400 font-semibold uppercase tracking-wider">u.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {topProducts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-surface-200/50 p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
                      🏆 Más vendidos (histórico)
                    </h3>
                    <div className="space-y-2">
                      {topProducts.slice(0, 5).map((t, i) => (
                        <div key={t.product.id} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-50 transition-colors">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                            ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-sm' :
                              i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                              i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                              'bg-surface-100 text-surface-500'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-surface-800 truncate">{t.product.name}</p>
                            <p className="text-[10px] text-surface-400">{t.salesCount} ventas</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-surface-900">{t.totalSold}</p>
                            <p className="text-[9px] text-surface-400 font-semibold uppercase tracking-wider">u.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {rankingLoading && <div className="flex justify-center py-2"><Spinner size="sm" /></div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product catalog list */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-200/50 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-surface-900">Productos disponibles</h3>
                  <span className="text-xs text-surface-400 font-semibold">{filteredStock.length} items</span>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none text-sm transition-colors"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                      ✕
                    </button>
                  )}
                </div>
                {stockLoading ? <Spinner /> : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredStock.length === 0 ? (
                      <p className="text-center text-surface-400 text-sm py-8">
                        {search ? 'No se encontraron productos' : 'Sin stock disponible'}
                      </p>
                    ) : filteredStock.map((item) => {
                      const inCart = cart.find((c) => c.productId === item.productId);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-100 hover:border-primary-200/60 transition-colors bg-surface-50/30">
                          <div>
                            <p className="font-semibold text-surface-900 text-sm">{item.product?.name}</p>
                            <p className="text-xs text-surface-400 font-medium mt-0.5">
                              Stock: <span className="font-bold text-surface-600">{item.quantity}</span> · Price: <span className="font-bold text-surface-700">${item.product?.price.toFixed(2)}</span>
                              {item.product?.barcode && <span className="ml-2 text-surface-300 font-semibold">({item.product.barcode})</span>}
                            </p>
                          </div>
                          <button onClick={() => item.product && addToCart(item.productId, item.product, item.quantity)}
                            disabled={!!inCart && inCart.quantity >= item.quantity}
                            className="px-3.5 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40">
                            {inCart ? `(${inCart.quantity})` : '+ Agregar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart POS */}
              <div className="bg-white rounded-2xl border border-surface-200/50 p-5 shadow-sm flex flex-col">
                <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">🛒 Carrito</h3>
                {cart.length === 0 ? <p className="text-surface-400 text-sm text-center py-12 font-medium">Agregá productos</p> : (
                  <>
                    <div className="space-y-3 flex-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-surface-800 truncate">{item.name}</p>
                            <p className="text-xs text-surface-400 font-bold mt-0.5">${item.unitPrice.toFixed(2)} c/u</p>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded border border-surface-200 text-xs font-bold flex items-center justify-center hover:bg-surface-100 cursor-pointer">−</button>
                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded border border-surface-200 text-xs font-bold flex items-center justify-center hover:bg-surface-100 cursor-pointer">+</button>
                            <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-surface-100 mt-4 pt-4 space-y-3">
                      <div className="flex justify-between font-bold text-lg text-surface-950"><span>Total</span><span>${total.toFixed(2)}</span></div>

                      {/* Payment mode toggle */}
                      <div className="flex rounded-xl border border-surface-200 overflow-hidden text-xs font-bold bg-surface-50 p-0.5">
                        <button
                          onClick={() => setSplitPayment(false)}
                          className={`flex-1 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${!splitPayment ? 'bg-white text-primary-700 shadow-sm border border-surface-200/40' : 'text-surface-500 hover:bg-surface-100'}`}
                        >
                          Pago único
                        </button>
                        <button
                          onClick={() => setSplitPayment(true)}
                          className={`flex-1 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${splitPayment ? 'bg-white text-primary-700 shadow-sm border border-surface-200/40' : 'text-surface-500 hover:bg-surface-100'}`}
                        >
                          Pago mixto
                        </button>
                      </div>

                      {!splitPayment ? (
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none font-semibold text-surface-700 bg-white">
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="DEBITO">Débito</option>
                          <option value="CREDITO">Crédito</option>
                          <option value="MERCADOPAGO">MercadoPago</option>
                        </select>
                      ) : (
                        <div className="space-y-2 p-3 rounded-2xl bg-surface-50 border border-surface-150">
                          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Dividir efectivo y débito</p>
                          <div>
                            <label className="text-xs font-semibold text-surface-600 block mb-1">Efectivo</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xs font-bold">$</span>
                              <input
                                type="number"
                                min="0"
                                max={total}
                                step="0.01"
                                value={cashAmount}
                                onChange={(e) => handleCashChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-surface-200 bg-white text-xs font-bold outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-surface-600 block mb-1">Débito</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xs font-bold">$</span>
                              <input
                                type="number"
                                min="0"
                                max={total}
                                step="0.01"
                                value={debitAmount}
                                onChange={(e) => handleDebitChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-surface-200 bg-white text-xs font-bold outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          {cashAmount && debitAmount && !splitValid && (
                            <p className="text-[10px] text-red-500 font-semibold">Los montos deben sumar ${total.toFixed(2)}</p>
                          )}
                          {splitValid && cashAmount && debitAmount && (
                            <p className="text-[10px] text-green-600 font-bold">Efectivo ${cashNum.toFixed(2)} + Débito ${debitNum.toFixed(2)}</p>
                          )}
                        </div>
                      )}

                      <button onClick={handleSubmitSale} disabled={submitting || (splitPayment && !splitValid)}
                        className="w-full py-3 rounded-2xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity cursor-pointer">
                        {submitting ? <Spinner size="sm" /> : 'Registrar Venta'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )
      ) : (
        /* TAB: HISTORIAL DE CAJA */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-surface-200/50 p-5 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" /> Historial de Sesiones de Caja
            </h3>
            <p className="text-xs text-surface-500">Listado histórico agrupado por fecha de apertura y cierres registrados.</p>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-surface-200/50 shadow-sm">
              <span className="text-4xl block mb-2">📋</span>
              <p className="text-surface-500 font-medium">No hay historial registrado</p>
              <p className="text-surface-400 text-sm mt-0.5">Las sesiones de caja cerradas se listarán acá.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <AccordionSession key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLOSE CAJA MODAL (WITH DETAILED ARQUEO BILL COUNTER) */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-surface-200/60 w-full max-w-4xl p-6 shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center pb-3 border-b border-surface-100 mb-4">
              <h3 className="text-lg font-bold text-surface-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" /> Cierre y Arqueo de Caja #{activeSession.id}
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-surface-400 hover:text-surface-600 text-sm font-bold">✕</button>
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
                      <span className="text-surface-700 font-bold">${(activeSession.openingBalance).toFixed(2)} + ventas</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-surface-900 pt-1">
                      <span>Total Contado</span>
                      <span className="text-primary-600">${computedActualBalance.toLocaleString()}</span>
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

// Collapsible CashSession element
function AccordionSession({ session }: { session: CashSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const diff = session.actualBalance !== null && session.expectedBalance !== null ? session.actualBalance - session.expectedBalance : 0;

  // Formatear el desglose de arqueo para mostrarlo en el historial
  const renderBillCounts = () => {
    if (!session.cashCount) return null;
    try {
      const counts = typeof session.cashCount === 'string' ? JSON.parse(session.cashCount) : session.cashCount;
      const entries = Object.entries(counts).filter(([_, qty]) => (qty as number) > 0);
      if (entries.length === 0) return <span className="text-surface-400 font-medium">Sin billetes contados (Arqueo vacío)</span>;
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {entries.map(([denom, qty]) => (
            <span key={denom} className="text-[10px] bg-surface-100 text-surface-700 px-2 py-0.5 rounded border border-surface-200 font-bold">
              {qty} x ${parseInt(denom).toLocaleString()}
            </span>
          ))}
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isOpen ? 'border-primary-200 shadow-sm' : 'border-surface-200/50 hover:border-surface-300'
    }`}>
      {/* Session Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer outline-none"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            session.status === 'OPEN' ? 'bg-green-50 text-green-600' : 'bg-surface-100 text-surface-500'
          }`}>
            {session.status === 'OPEN' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-surface-900">Caja #{session.id}</span>
              <span className={`status-badge ${session.status === 'OPEN' ? 'status-open' : 'status-closed'}`}>
                {session.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
              </span>
            </div>
            <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider mt-0.5">
              Apertura: {new Date(session.openedAt).toLocaleDateString()} {new Date(session.openedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}hs por {session.openedBy?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Recaudado</p>
            <p className="text-sm font-bold text-surface-900">${session.actualBalance !== null ? session.actualBalance.toLocaleString() : '---'}</p>
          </div>
          <span className="text-surface-400 font-bold transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </div>
      </button>

      {/* Session details */}
      {isOpen && (
        <div className="p-4 border-t border-surface-100 bg-surface-50/20 rounded-b-2xl space-y-4 animate-scale-in">
          {/* Cash Summary details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-surface-200/50 p-3.5 rounded-xl">
            <div>
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Saldo Inicial</p>
              <p className="text-sm font-bold text-surface-800">${session.openingBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Saldo Esperado</p>
              <p className="text-sm font-bold text-surface-800">${session.expectedBalance !== null ? session.expectedBalance.toFixed(2) : '---'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Saldo Real (Contado)</p>
              <p className="text-sm font-bold text-surface-800">${session.actualBalance !== null ? session.actualBalance.toFixed(2) : '---'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Diferencia</p>
              {session.status === 'CLOSED' ? (
                <p className={`text-sm font-extrabold ${diff > 0.01 ? 'text-green-600' : diff < -0.01 ? 'text-red-600' : 'text-surface-700'}`}>
                  {diff > 0.01 ? `+$${diff.toFixed(2)} (Sobrante)` : diff < -0.01 ? `-$${Math.abs(diff).toFixed(2)} (Faltante)` : '$0.00'}
                </p>
              ) : (
                <p className="text-sm font-bold text-surface-500">Caja Activa</p>
              )}
            </div>
          </div>

          {/* Detailed arqueo breakdown */}
          {session.status === 'CLOSED' && session.cashCount && (
            <div className="bg-white border border-surface-200/50 p-3.5 rounded-xl space-y-2">
              <h5 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Arqueo Detallado de Caja:</h5>
              {renderBillCounts()}
            </div>
          )}

          {session.notes && (
            <div className="bg-amber-50/50 border border-amber-200/30 rounded-xl p-3 text-xs">
              <span className="font-bold text-amber-800 block mb-0.5">Observaciones:</span>
              <p className="text-amber-950 font-medium">{session.notes}</p>
            </div>
          )}

          {/* Sales listing inside session */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Ventas de esta Caja:</h4>
            {!session.sales || session.sales.length === 0 ? (
              <p className="text-center text-xs text-surface-400 py-4 font-semibold bg-white rounded-xl border border-surface-100">Sin ventas en esta sesión</p>
            ) : (
              session.sales.map((sale) => (
                <AccordionSale key={sale.id} sale={sale} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible individual Sale element inside session
function AccordionSale({ sale }: { sale: SaleSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-surface-200/40 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3.5 py-3 flex items-center justify-between gap-3 cursor-pointer outline-none hover:bg-surface-50/30"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-surface-800">Venta #{sale.id}</span>
            <span className="text-[10px] text-surface-500 font-bold">{new Date(sale.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}hs</span>
          </div>
          <p className="text-[10px] text-surface-400 font-bold mt-0.5 uppercase tracking-wider">Vendedor: {sale.user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-extrabold text-primary-600 block">${sale.total.toFixed(2)}</span>
            <span className="text-[9px] text-surface-400 font-bold uppercase tracking-wider">{sale.paymentMethod}</span>
          </div>
          <span className="text-surface-400 text-xs font-bold" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-surface-50/20 border-t border-surface-100 space-y-1.5 text-xs">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-surface-700 font-semibold">
              <span>{item.product?.name} <span className="text-[10px] text-surface-400 font-bold">x{item.quantity}</span></span>
              <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
            </div>
          ))}
          {sale.paymentMethod === 'MIXTO' && sale.payments && (
            <div className="border-t border-surface-100 pt-1.5 mt-1.5 text-[10px] font-bold text-surface-500 flex justify-between uppercase">
              <span>Desglose de pagos:</span>
              <span className="text-surface-700">
                {sale.payments.map((p: any) => `${p.method}: $${p.amount}`).join(' + ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Task 8: Dashboard Linking & Redirections

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Link "Ventas de hoy" widget to Sales History**

Open `frontend/src/pages/Dashboard.tsx`. Locate the card container showing the sales totals today (around lines 330-360):

```tsx
          {/* Card: Total Ventas del Día */}
          <div
            onClick={() => navigate('/sales')}
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-between p-4"
          >
```

Replace it to pass route navigation state redirect:

```tsx
          {/* Card: Total Ventas del Día */}
          <div
            onClick={() => navigate('/sales', { state: { activeTab: 'history' } })}
            className="glass-card hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-between p-4"
          >
```

- [ ] **Step 2: Verify compile and build**

Run compile check in the `frontend/` directory:
```powershell
npm run build
```
Expected: The frontend compiles cleanly with no typescript errors.

- [ ] **Step 3: Commit all frontend page changes**

```bash
git add frontend/src/pages/Sales.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: design point of sale to lock when cash drawer closed, add close modals and collapsible history grouped by cash session"
```
