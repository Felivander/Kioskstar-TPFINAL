# Spec - Hybrid Dashboard Redesign

Implement a hybrid operational and analytical dashboard for KioskStar that is extremely simple, foolproof, and optimized for both desktop and mobile devices.

---

## 1. Overview & Requirements
- **Goal:** Redesign the main dashboard into a focused operational and analytical hub. It must provide quick, single-tap actions for common kiosk tasks ("a prueba de bobos") while displaying concise business performance insights.
- **Audience:** Kiosk administrators and employees operating the register or managing stock.
- **Layout Constraint:** The dashboard must be centered and width-restricted to `max-w-3xl mx-auto px-4 py-6` to avoid stretching too wide on large screens.

## 2. UI Components & Visual Specification

### Welcome & Context Banner
- A premium, full-width gradient banner (`bg-gradient-to-br from-surface-900 via-primary-900/80 to-surface-900 text-white rounded-2xl p-6`).
- Shows dynamic greeting based on time of day ("Buenos días", "Buenas tardes", "Buenas noches") followed by the user's name.
- Explicitly displays the active branch or kiosk name.
- For administrators, provides a clean "Cambiar sucursal" text link/button to return to the branch selector.

### Quick Actions Grid
- A responsive grid (`grid grid-cols-2 md:grid-cols-4 gap-4`) located directly beneath the welcome banner.
- Contains large, easy-to-tap interactive cards for the four primary workflows:
  1. 💰 **Registrar Venta**: Direct link to `/sales`.
  2. 📦 **Cargar Stock**: Direct link to `/stock`.
  3. 🗺️ **Ver Mapa**: Direct link to `/map`.
  4. 👥 **Invitar Empleado**: Admin-only action (triggers invitation modal or link, e.g., to Account/Personal).
- **Styling**: White card background, subtle border (`border-surface-200/60`), large emoji/icon (e.g., 2xl), bold label, and smooth hover transition (`hover:border-primary-400 hover:shadow-lg hover:-translate-y-0.5 transition-all`).

### Metrics & Alerts Grid
- A two-column grid (`grid grid-cols-1 md:grid-cols-2 gap-4`) for live feedback:
  - **Ventas de Hoy**: Displays total revenue today (`$XX,XXX`) with a positive green indicator.
  - **Alertas de Stock**: Displays the number of products out of stock. If greater than 0, uses a soft red warning background and border (`bg-red-50/50 border-red-200 text-red-900`) to grab attention immediately.

### Sales Activity Chart (Visual Analytics)
- A compact container displaying today's sales distribution by time of day (Morning, Midday, Afternoon).
- Renders a clean, lightweight inline SVG bar chart.
- The height of each bar corresponds dynamically to the percentage of sales completed in that time window.
- Placed side-by-side or stacked cleanly next to the metrics on desktop, and stacked below on mobile.

---

## 3. Data Flow & State Management
- **Auth State**: Read active user, role (`isAdmin`, `isEmpleado`), and `selectedBranch` from Redux auth slice.
- **Backend Fetching**:
  - Query `/api/sales` to fetch today's sales for the active branch:
    - Aggregate the `total` of all sales where `createdAt` is today.
    - Parse the hour of each sale to distribute them into time windows:
      - **Mañana** (06:00 - 12:00)
      - **Mediodía** (12:00 - 16:00)
      - **Tarde/Noche** (16:00 - 24:00)
  - Query `/api/products` (or the branch stock endpoint `/api/branches/:branchId/stock`) to count the number of products in the database with 0 quantity.

---

## 4. Verification & Testing
- Verify successful compilation with `npm run build` in `frontend/`.
- Test dashboard rendering for all three user roles:
  - **ADMIN**: Sees branch selector (if no branch picked), welcome banner, all 4 quick action buttons, metrics, and invitation/employee states.
  - **EMPLEADO**: Auto-assigned to branch, sees welcome banner, Vender/Stock/Mapa buttons (Invitar Empleado disabled/hidden), and branch metrics.
  - **CLIENTE**: Sees welcome banner, but gets a clean visitor message with a prominent CTA to go search the map.
- Test mobile view responsiveness.
