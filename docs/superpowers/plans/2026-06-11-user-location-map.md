# User Location and Recenter Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a custom orange pulsing user location marker and a floating recenter button on the MapView screen.

**Architecture:** Add a recenter geolocation handler in MapView.tsx, render a floating absolute-positioned button on the map that triggers recentering, and style the AdvancedMarker component for the user location.

**Tech Stack:** React, Tailwind CSS, Lucide React, Google Maps SDK.

---

### Task 1: Add Geolocation Recentering and Floating Button

**Files:**
- Modify: `frontend/src/pages/MapView.tsx`

- [ ] **Step 1: Import Locate icon from lucide-react**

Import `Locate` at the top of the file:
```typescript
import { Locate } from 'lucide-react';
```

- [ ] **Step 2: Add recenter function**

Inside `MapView` component, add the following handler to retrieve browser coordinates and update map position:
```typescript
  const recenterUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
          setZoom(15);
        },
        () => {
          alert('No se pudo acceder a tu ubicación. Por favor activa los permisos de GPS.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };
```

- [ ] **Step 3: Add recenter button**

Find the `<GoogleMap>` component tag inside the return statement (around lines 309-320). Add the absolute positioned button overlay inside the relative container of the map (`relative flex-1 min-h-[350px] lg:min-h-0 w-full h-full lg:w-5/6`):
```tsx
            {/* Botón Geolocalización */}
            <button
              onClick={recenterUserLocation}
              className="absolute right-4 bottom-24 bg-white hover:bg-surface-50 border border-surface-200/80 rounded-xl p-2.5 shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer z-10 text-primary-600 flex items-center justify-center"
              title="Mi ubicación"
            >
              <Locate size={18} />
            </button>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/MapView.tsx
git commit -m "feat: add map recenter geolocation button"
```

---

### Task 2: Style User Location Marker as Orange Pulsing Dot

**Files:**
- Modify: `frontend/src/pages/MapView.tsx`

- [ ] **Step 1: Update AdvancedMarker styling**

Find the user location marker block inside `<GoogleMap>`:
```tsx
                  {/* User location */}
                  <AdvancedMarker position={userLocation}>
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                  </AdvancedMarker>
```
Replace it with the customized orange pulsing design:
```tsx
                  {/* User location */}
                  <AdvancedMarker position={userLocation}>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-8 h-8 rounded-full bg-primary-400/30 animate-ping" />
                      <div className="absolute w-12 h-12 rounded-full bg-primary-500/10 blur-sm -z-10" />
                      <div className="w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-white shadow-md" />
                    </div>
                  </AdvancedMarker>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/MapView.tsx
git commit -m "style: custom orange pulsing user location marker"
```

---

### Task 3: Verification

- [ ] **Step 1: Compile the frontend app**

Run the production build:
`cmd.exe /c "set PATH=%PATH%;C:\Program Files\nodejs&& npm run build"`
Expected: Compilation completes with no errors.
