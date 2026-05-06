# 🌟 KioskStar — Plan de Desarrollo TIF

> Red de kioscos inteligentes: gestión de stock, ventas con MercadoPago y mapa público para clientes.

---

## 👥 Equipo

| Integrante | Rol Plus Individual |
|---|---|
| Julián | APIs Externas: Google Maps + IA (visión) + MercadoPago |
| Patricia | Seguridad Avanzada: Zod + Roles + JWT Middleware |
| Felicitas | UX/UI: Redux Toolkit + Responsive + Accesibilidad |

---

## 🏗️ Stack Tecnológico

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT + Bcrypt + Zod
- MercadoPago SDK (Node)
- Arquitectura: `controllers/` `routes/` `middlewares/` `services/`

### Frontend
- React + TypeScript + Vite
- Redux Toolkit
- TailwindCSS
- React Router DOM
- Google Maps JS API
- Axios

### Deploy
- Backend → [Render](https://render.com)
- Frontend → [Vercel](https://vercel.com)
- DB → PostgreSQL en Render

---

## 🗄️ Modelo de Base de Datos

```
Users (id, name, email, password, role, createdAt)
  └── Kiosks (id, name, ownerId→Users, address, lat, lng)
        └── Branches (id, kioskId→Kiosks, name, address, lat, lng)
              ├── Stock (id, branchId, productId→Products, quantity)
              └── Sales (id, branchId, userId, total, paymentMethod, createdAt)
                    └── SaleItems (id, saleId, productId, quantity, unitPrice)

Products (id, name, barcode, categoryId→Categories, imageUrl, description)
Categories (id, name, description)
```

**8 tablas** → cumple y supera el mínimo de 4 requerido.

---

## 🔐 Roles y Permisos

| Acción | Admin | Empleado | Cliente |
|---|:---:|:---:|:---:|
| Gestionar kioscos/sucursales | ✅ | ❌ | ❌ |
| Cargar/editar productos | ✅ | ✅ | ❌ |
| Registrar ventas | ✅ | ✅ | ❌ |
| Ver stock de su sucursal | ✅ | ✅ | ❌ |
| Ver mapa público de kioscos | ✅ | ✅ | ✅ |
| Buscar producto en mapa | ✅ | ✅ | ✅ |

---

## 📋 Endpoints API (referencia)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/me`
- `PUT /api/users/:id`

### Kiosks
- `GET /api/kiosks` — lista pública
- `POST /api/kiosks` — solo Admin
- `GET /api/kiosks/:id`
- `PUT /api/kiosks/:id`
- `DELETE /api/kiosks/:id`

### Branches (sucursales)
- `GET /api/kiosks/:kioskId/branches`
- `POST /api/kiosks/:kioskId/branches`
- `PUT /api/branches/:id`
- `DELETE /api/branches/:id`

### Products
- `GET /api/products`
- `POST /api/products` — Admin/Empleado
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/scan` — 🤖 IA: recibe imagen, devuelve datos del producto

### Stock
- `GET /api/branches/:branchId/stock` — público
- `PUT /api/branches/:branchId/stock/:productId`

### Sales
- `POST /api/sales` — registra venta
- `GET /api/branches/:branchId/sales` — historial

### Payments (MercadoPago)
- `POST /api/payments/create-preference` — crea preferencia MP
- `GET /api/payments/success`
- `GET /api/payments/failure`

### Map (público)
- `GET /api/map/kiosks?lat=&lng=&radius=` — kioscos cercanos
- `GET /api/map/search?product=&lat=&lng=` — buscar producto en kioscos cercanos

---

## 🗓️ Fases de Desarrollo

### Fase 1 — Diseño y Arquitectura (Semana 1)
- [x] Definir y diagramar el DER final
- [x] Crear el repositorio en GitHub con estructura de carpetas
- [x] Configurar el proyecto: `tsconfig`, `prisma init`, `eslint`
- [x] Definir wireframes básicos de las pantallas principales
- [x] Repartir las tareas de la Fase 2

### Fase 2 — Backend Core (Semanas 2-3)
- [x] Setup Express + TypeScript + estructura de carpetas
- [x] Configurar Prisma + PostgreSQL + ejecutar migraciones
- [x] **Auth**: register, login, JWT middleware, Bcrypt — *Patricia*
- [x] **Zod schemas** para todos los inputs — *Patricia*
- [x] **Middleware de roles** (Admin / Empleado / Cliente) — *Patricia*
- [x] CRUD Kioscos y Sucursales — *Julián*
- [x] CRUD Productos y Categorías — *Julián / Patricia*
- [x] Gestión de Stock por sucursal — *Julián*
- [x] Registro de Ventas + SaleItems — *Julián*
- [x] Endpoint de búsqueda por mapa (`/api/map/*`) — *Julián*

### Fase 3 — Integraciones y Frontend (Semanas 4-5)
- [ ] **MercadoPago**: crear preferencia + webhooks — *Julián*
- [x] **IA de visión**: endpoint `/api/products/scan` con Claude Vision o Google Vision — *Julián* (placeholder)
- [ ] **Google Maps API**: mapa de kioscos + búsqueda por producto — *Julián*
- [x] Setup React + Vite + TypeScript + TailwindCSS — *Felicitas*
- [x] Configurar Redux Toolkit (slices: auth, kiosks, stock, cart) — *Felicitas*
- [x] Pantalla Login / Register — *Felicitas*
- [x] Dashboard Admin (kioscos, sucursales, productos) — *Felicitas*
- [x] Pantalla de Stock por sucursal — *Felicitas*
- [x] Pantalla de Carga de Producto (con botón de escaneo IA) — *Felicitas*
- [x] Pantalla de Registro de Venta — *Felicitas*
- [x] Pantalla pública: Mapa de Kioscos + buscador — *Felicitas / Julián*
- [x] Diseño responsive, Skeletons, Spinners, Toasts — *Felicitas*

### Fase 4 — Deploy, Testing y Documentación (Semana 6)
- [ ] Deploy backend en Render
- [ ] Deploy frontend en Vercel
- [ ] Variables de entorno configuradas en producción
- [ ] Probar flujo completo en producción
- [ ] Redactar README.md profesional con sección "Contribuciones Individuales"
- [ ] Documentar endpoints en README o Swagger
- [ ] Grabar video demo de 3 minutos
- [ ] Preparar presentación grupal (DER + arquitectura + demo)
- [ ] Preparar defensa individual de cada Plus

---

## 📦 Estructura de Carpetas

```
kioskstar/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── kiosk.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── stock.controller.ts
│   │   │   ├── sale.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   └── map.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── kiosk.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── stock.routes.ts
│   │   │   ├── sale.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   └── map.routes.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts       ← JWT verify
│   │   │   ├── role.middleware.ts       ← Admin/Empleado/Cliente
│   │   │   └── validate.middleware.ts  ← Zod validation
│   │   ├── services/
│   │   │   ├── ai.service.ts           ← IA visión (scan producto)
│   │   │   ├── maps.service.ts         ← Google Maps / geoloc
│   │   │   └── payment.service.ts      ← MercadoPago
│   │   ├── schemas/                    ← Zod schemas
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Stock.tsx
    │   │   ├── ScanProduct.tsx
    │   │   ├── NewSale.tsx
    │   │   └── MapView.tsx
    │   ├── store/                       ← Redux Toolkit
    │   │   ├── index.ts
    │   │   ├── authSlice.ts
    │   │   ├── kioskSlice.ts
    │   │   └── stockSlice.ts
    │   ├── services/                    ← llamadas a la API
    │   ├── hooks/
    │   ├── types/
    │   └── App.tsx
    ├── .env
    └── package.json
```

---

## ✅ Checklist de Requisitos TIF

### Para Regularizar
- [ ] Backend Node.js + Express + TypeScript con arquitectura de carpetas
- [ ] Mínimo 4 tablas relacionadas con Prisma ✅ (tenemos 8)
- [ ] Login y Registro con Bcrypt + JWT
- [ ] CRUD completo desde el frontend (Productos)
- [ ] Frontend React + TypeScript consumiendo API propia
- [ ] Deploy en Render + Vercel

### Para Promocionar
- [ ] **Julián**: APIs externas (Maps + IA + MercadoPago) con manejo de errores robusto
- [ ] **Patricia**: Zod en todos los inputs + roles con permisos en backend
- [ ] **Felicitas**: Redux Toolkit + 100% responsive + accesible + Skeletons/Spinners

### Entregables
- [ ] Repositorio GitHub con commits de cada integrante
- [ ] README.md profesional con sección "Contribuciones Individuales"
- [ ] DER y lista de endpoints documentados
- [ ] Video demo de 3 minutos

---

## 🔑 Variables de Entorno (backend)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
MERCADOPAGO_ACCESS_TOKEN=...
GOOGLE_MAPS_API_KEY=...
ANTHROPIC_API_KEY=...   # o GOOGLE_VISION_API_KEY
PORT=3000
```

---

## 📌 Notas del Equipo

- El stock es **público por sucursal**: cualquier usuario (incluso sin login) puede ver el stock de un kiosko desde el mapa.
- La carga de productos por IA es una **aceleración del formulario**, no reemplaza la confirmación humana. El empleado revisa y confirma antes de guardar.
- MercadoPago se integra primero con **Checkout Pro** (redirect) para simplificar, y se puede migrar a Checkout Bricks en una segunda iteración.
- Usar **monorepo simple** (una sola repo, dos carpetas: `/backend` y `/frontend`) para facilitar la colaboración.
