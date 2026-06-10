# Specification: Top Navbar and Kiosk Banner Integration

## Goal
Redesign the application's layout to replace the sidebar navigation with a fixed top glassmorphic navbar. Additionally, extend the Kiosk data model to support image URLs and display a banner image inside the Google Maps InfoWindow on click.

---

## Proposed Changes

### 1. Database & Seeder Update (`backend`)

#### Model Change
In `c:\Users\feliv\Documents\Kioskstar-TPFINAL\backend\prisma\schema.prisma`, modify the `Kiosk` model to include an optional image URL field:
```prisma
model Kiosk {
  // ... existing fields
  imageUrl   String?
  // ...
}
```

#### Migration
Generate and execute the migration:
```bash
npx prisma migrate dev --name add_kiosk_image_url
```

#### Seeder Changes
In `c:\Users\feliv\Documents\Kioskstar-TPFINAL\backend\prisma\seed.ts`, define a list of curated Unsplash image URLs representing kiosk fronts:
```typescript
const kioskImages = [
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1580793241553-e9f1cce1d107?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  // ... (10 curated images)
];
```
Populate `imageUrl` for each of the 40 seeded kiosks using `kioskImages[i % kioskImages.length]`.

---

### 2. Backend API Changes (`backend`)

#### Map Controller
Modify `c:\Users\feliv\Documents\Kioskstar-TPFINAL\backend\src\controllers\map.controller.ts`:
- Include `imageUrl` in the `kiosk` select statements in both `getKiosksNearby` and `searchProductInMap`.

---

### 3. Frontend Layout Redesign (`frontend`)

#### Layout Component (`Layout.tsx`)
In `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\components\Layout.tsx`:
- Remove the left `<aside>` sidebar structure and the mobile left navigation drawer.
- Implement a sticky, glassmorphic header navbar (`sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-surface-200/50 z-40`).
- **Desktop Navigation**: Links (Dashboard, Ventas, Productos, Stock, Mapa) aligned horizontally.
- **Mobile Navigation**: An expandable toggle dropdown that opens downwards directly underneath the top bar when the hamburger button is clicked.
- **User Actions**: Profile bubble and "Cerrar Sesión" button aligned on the right of the header.

---

### 4. Kiosk Detail Banner (`frontend`)

#### Map View (`MapView.tsx`)
In `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\pages\MapView.tsx`:
- Extend type definitions `MapBranch` and `SearchResult` to include `kiosk: { imageUrl?: string }`.
- Update the Google Maps `<InfoWindow>` component:
  - Add a top image banner `w-full h-32 object-cover` displaying `selectedBranch.kiosk.imageUrl`.
  - Provide a CSS fallback (gradient background with a `🏪` shop icon) if the image is missing or fails to load.
  - Wrap text details and product stock lists in a padded `p-3` container below the banner image.

---

## Verification Plan

### Automated Tests & Checks
- Run `npm run build` on both `backend/` and `frontend/` to check for TypeScript errors.
- Confirm database migration executes cleanly and seed script completes.

### Manual Verification
- Open the application in the browser at `http://localhost:5173`.
- Verify the navigation bar sits fixed at the top of the viewport and handles responsive resizing (desktop menu vs. mobile hamburger dropdown).
- Navigate to the Map page (`/map`). Click on a kiosk pin and verify the `InfoWindow` displays a cover image banner cleanly at the top of the popover.
