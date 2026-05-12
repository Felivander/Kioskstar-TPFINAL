# CLAUDE.md — KioskStar Project Context

> **Read this file at the start of every session.** Keep it updated as the project evolves.

---

## 🎯 What Is This?

**KioskStar** — Full-stack platform for managing kiosk networks in Argentina.
TIF (Trabajo Integrador Final) for a university course. Three team members, each with a "Plus Individual" feature.

## 👥 Team & Individual Plus

| Person | Plus | Scope |
|---|---|---|
| **Julián** | External APIs | Google Maps + AI Vision (product scan) + MercadoPago payments |
| **Patricia** | Advanced Security | Zod validation + Role-based middleware + JWT auth |
| **Felicitas** | UX/UI & State | Redux Toolkit + Responsive design + Accessibility (ARIA, Skeletons, Spinners) |

## 🏗️ Architecture

Monorepo with two apps: `/backend` and `/frontend`.

### Backend (`/backend`)
- **Runtime**: Node.js + Express 5 + TypeScript 6
- **ORM**: Prisma 6 + PostgreSQL
- **Auth**: JWT (jsonwebtoken) + Bcrypt 6
- **Validation**: Zod 4
- **Dev server**: `npm run dev` → `tsx watch src/index.ts`
- **Port**: 3000 (default)

**Layer pattern**:
```
routes/ → middlewares/ → controllers/ → services/ → prisma
                ↓
           schemas/ (Zod)
```

### Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript 6 + Vite 8
- **State**: Redux Toolkit 2 (slices: auth, kiosks, stock)
- **Styling**: TailwindCSS 4 (via `@tailwindcss/vite`)
- **Router**: React Router DOM 7
- **HTTP**: Axios with JWT interceptor
- **Toasts**: react-hot-toast
- **Dev server**: `npm run dev` → Vite

**Vite proxies `/api` → `http://localhost:3000`** so frontend calls `api.post('/auth/login')` without CORS issues in dev.

## 🗄️ Database Schema (8 tables)

```
User (id, name, email, password, role[ADMIN|EMPLEADO|CLIENTE])
  └─ Kiosk (id, name, ownerId→User, address, lat, lng)
       └─ Branch (id, kioskId→Kiosk, name, address, lat, lng)
            ├─ Stock (branchId+productId UNIQUE, quantity)
            └─ Sale (id, branchId, userId, total, paymentMethod)
                 └─ SaleItem (saleId, productId, quantity, unitPrice)

Category (id, name UNIQUE, description)
  └─ Product (id, name, barcode UNIQUE?, categoryId, imageUrl?, price)
```

**Enums**: `Role` (ADMIN, EMPLEADO, CLIENTE), `PaymentMethod` (EFECTIVO, MERCADOPAGO, DEBITO, CREDITO)

## 🔌 API Endpoints

| Group | Base | Key endpoints |
|---|---|---|
| Auth | `/api/auth` | POST register, POST login, POST onboard, POST join-kiosk |
| Auth | `/api/auth` | POST kiosks/:kioskId/invite-code (admin generates code) |
| Kiosks | `/api/kiosks` | CRUD (Admin only for write) |
| Branches | `/api/branches` | CRUD nested under kiosks |
| Products | `/api/products` | CRUD + POST `/scan` (AI vision) |
| Stock | `/api/branches/:branchId/stock` | GET (public), PUT update |
| Sales | `/api/sales` | POST create, GET history |
| Payments | `/api/payments` | POST create-preference (MercadoPago) |
| Map | `/api/map` | GET kiosks?lat&lng&radius, GET search?product&lat&lng |

## 🔐 Auth & Roles & Onboarding

- **Register**: Always creates CLIENTE with `onboarded: false`. No role picker.
- **Onboarding wizard** (post-register, `/onboarding`):
  - Choice: "Soy cliente" → mark onboarded, stay CLIENTE
  - Choice: "Tengo un kiosco" → kiosk setup wizard → promote to ADMIN
  - Choice: "Tengo código de empleado" → enter invite code → promote to EMPLEADO
- **Employee invite**: Admin generates 8-char code via `POST /api/auth/kiosks/:id/invite-code` (7-day expiry, single use)
- JWT token in `Authorization: Bearer <token>` header
- `authMiddleware` → extracts `userId` + `userRole` from token
- `roleMiddleware(...roles)` → checks if `userRole` is in allowed list
- `validate(schema)` → Zod body validation, `validateParams`, `validateQuery`

**Frontend**: Token stored in `localStorage`. Axios interceptor auto-attaches it. 401 → auto-logout + redirect to `/login`. Users without `onboarded: true` get redirected to `/onboarding`.

## 📱 Frontend Pages & Routes

| Route | Component | Access |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/onboarding` | Onboarding | Authenticated + not onboarded |
| `/dashboard` | Dashboard | All onboarded |
| `/products` | Products | ADMIN, EMPLEADO |
| `/stock` | Stock | ADMIN, EMPLEADO |
| `/sales` | Sales | ADMIN, EMPLEADO |
| `/map` | MapView | All onboarded |

Protected by `<ProtectedRoute>` component with `allowedRoles` + `requireOnboarded` props.

## 🔧 Commands

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev                    # tsx watch → localhost:3000
npm run prisma:seed            # seed DB with sample data

# Frontend
cd frontend
npm install
npm run dev                    # Vite → localhost:5173 (proxied to backend)

# Build
cd backend && npm run build    # tsc → dist/
cd frontend && npm run build   # tsc + vite build → dist/
```

## 🌍 Environment Variables (backend/.env)

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
MERCADOPAGO_ACCESS_TOKEN=
GOOGLE_MAPS_API_KEY=
ANTHROPIC_API_KEY=
PORT=3000
```

## 📊 Current Status

### ✅ Done
- Backend: Full Express setup, layered architecture, all CRUD endpoints
- Prisma schema: 8 tables, migrations, seed script
- Auth: Register/Login with JWT + Bcrypt
- Security: Zod schemas for all inputs, role middleware
- Frontend: React + Vite + TailwindCSS setup
- Redux: auth, kiosks, stock slices
- Pages: Login, Register, Dashboard, Products, Stock, Sales, MapView
- Components: Layout, ProtectedRoute, Skeleton, Spinner
- API service with JWT interceptor

### 🔲 Pending
- MercadoPago integration (checkout preference + webhooks)
- Google Maps API (interactive map in MapView)
- AI Vision endpoint (product scan via Claude/Google Vision)
- Deploy: Backend → Render, Frontend → Vercel
- README.md documentation
- Video demo
- Swagger/API docs

## ⚠️ Conventions & Gotchas

1. **Language**: Code comments and UI text in **Spanish**. Variable/function names in **English**.
2. **Express 5**: Uses `express@5.2.1` — route handlers return void, error handling slightly different from v4.
3. **Prisma 6**: Uses `@prisma/client@^6`. Run `prisma generate` after schema changes.
4. **Zod 4**: Uses `zod@^4.4.3`. Import from `'zod'`.
5. **TypeScript 6**: Both backend and frontend use TS 6.
6. **Stock route overlap**: Both `stockRoutes` and `branchRoutes` mount on `/api/branches` — stock routes handle `/:branchId/stock` paths.
7. **Seed users**: admin@kioskstar.com (admin123), empleado@kioskstar.com (empleado123), cliente@kioskstar.com (cliente123).
8. **OS**: Windows. Use `py -m pip` instead of `pip`. Use PowerShell.
9. **Communication**: Use **caveman mode** (terse, no filler, fragments OK). See `.agents/rules/caveman.md`.

## 📁 Key File Locations

```
backend/
  src/index.ts                    ← Express app entry
  src/controllers/*.controller.ts ← Request handlers
  src/routes/*.routes.ts          ← Route definitions
  src/middlewares/auth.middleware.ts ← JWT verify + AuthRequest type
  src/middlewares/role.middleware.ts ← Role-based access
  src/middlewares/validate.middleware.ts ← Zod validation (body/params/query)
  src/schemas/*.schema.ts         ← Zod schemas
  src/services/*.service.ts       ← External API integrations
  src/lib/prisma.ts               ← PrismaClient singleton
  prisma/schema.prisma            ← DB models
  prisma/seed.ts                  ← Seed script

frontend/
  src/App.tsx                     ← Routes definition
  src/main.tsx                    ← React entry + Provider + BrowserRouter
  src/services/api.ts             ← Axios instance + interceptors
  src/store/index.ts              ← Redux store config
  src/store/authSlice.ts          ← Auth state + login/register thunks
  src/store/kioskSlice.ts         ← Kiosk state
  src/store/stockSlice.ts         ← Stock state
  src/types/index.ts              ← Shared TypeScript interfaces
  src/pages/*.tsx                 ← Page components
  src/components/*.tsx            ← Shared components
```

---

*Last updated: 2026-05-11*
