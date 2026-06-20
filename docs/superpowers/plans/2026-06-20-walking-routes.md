# Trazado de Rutas Caminando en Mapa - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar trazado de ruta de caminata desde ubicación del usuario hasta el kiosco seleccionado en el mapa o el más cercano al buscar un producto.

**Architecture:** Crear componente React `Directions` que encapsula `DirectionsService` y `DirectionsRenderer` de Google Maps, instanciándolo en `MapView.tsx` para dibujar rutas dinámicamente y actualizar la UI con distancia/tiempo estimado de caminata.

**Tech Stack:** React 19, TypeScript 6, `@vis.gl/react-google-maps` 1.8.3

---

### Task 1: Crear Componente Directions

**Files:**
- Create: `frontend/src/components/Directions.tsx`

- [ ] **Step 1: Crear archivo del componente**

Crear el archivo `frontend/src/components/Directions.tsx` con la implementación del trazado de ruta de caminata:

```typescript
import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface DirectionsProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
  onRouteCalculated?: (durationText: string, distanceText: string) => void;
}

export function Directions({ origin, destination, onRouteCalculated }: DirectionsProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLib || !map) return;
    setDirectionsService(new routesLib.DirectionsService());
    setDirectionsRenderer(new routesLib.DirectionsRenderer({ map, suppressMarkers: true }));
  }, [routesLib, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;
    if (!destination) {
      directionsRenderer.setDirections({ routes: [] });
      return;
    }

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          if (onRouteCalculated && result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            onRouteCalculated(leg.duration?.text || '', leg.distance?.text || '');
          }
        } else {
          console.error('Error drawing route:', status);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin, destination, onRouteCalculated]);

  useEffect(() => {
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [directionsRenderer]);

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Directions.tsx
git commit -m "feat(map): create Directions helper component"
```

---

### Task 2: Modificar MapView y Agregar Estados de Ruta

**Files:**
- Modify: `frontend/src/pages/MapView.tsx`

- [ ] **Step 1: Importar componente y agregar estados**

Modificar `frontend/src/pages/MapView.tsx` para importar `Directions` y agregar estados `routeDestination` y `routeInfo` en `MapView`:

```typescript
// Importar al inicio:
import { Directions } from '../components/Directions';

// Agregar en MapView:
const [routeDestination, setRouteDestination] = useState<{ lat: number; lng: number } | null>(null);
const [routeInfo, setRouteInfo] = useState<{ duration: string; distance: string } | null>(null);
```

- [ ] **Step 2: Manejar reinicio de ruta al seleccionar branch**

Modificar `selectBranchAndZoom` para limpiar ruta al cambiar selección:
```typescript
  const selectBranchAndZoom = (b: MapBranch) => {
    setRouteDestination(null);
    setRouteInfo(null);
    if (selectedBranch?.id === b.id) {
      setSelectedBranch(null);
      if (mapRef.current) {
        mapRef.current.setZoom(13);
      }
    } else {
      setSelectedBranch(b);
      // ... resto del código sin cambios ...
```

- [ ] **Step 3: Auto-trazar ruta al buscar producto**

Modificar `performSearch` para asignar la ruta al kiosco más cercano de forma automática:
```typescript
      // Mark closest
      if (sortedBranches.length > 0) {
        setClosestBranchId(sortedBranches[0].id);
        setRouteDestination({ lat: sortedBranches[0].lat, lng: sortedBranches[0].lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat: sortedBranches[0].lat, lng: sortedBranches[0].lng });
        }
      }
```

- [ ] **Step 4: Limpiar ruta al cancelar búsqueda o cerrar panel**

Modificar el botón de limpiar búsqueda y cierre del panel:
```typescript
  // En performSearch query vacío:
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { 
      loadBranches(); 
      setRouteDestination(null);
      setRouteInfo(null);
      return; 
    }

  // En renderDetailsContent botón de cerrar:
  <button
    onClick={() => { setSelectedBranch(null); setRouteDestination(null); setRouteInfo(null); }}
    className="absolute top-2.5 right-2.5 ..."
  >
```

- [ ] **Step 5: Integrar componente Directions en el Mapa**

Insertar el componente `<Directions>` dentro de `<GoogleMap>`:
```typescript
                <GoogleMap
                  defaultCenter={DEFAULT_CENTER}
                  defaultZoom={13}
                  mapId="kioskstar-map"
                  gestureHandling="greedy"
                  disableDefaultUI={true}
                  className="w-full h-full"
                >
                  <MapHandler mapRef={mapRef} initialCenter={initialCenter} />
                  {/* User location */}
                  <AdvancedMarker position={userLocation}>
                    ...
                  </AdvancedMarker>

                  {/* Directions Renderer */}
                  {routeDestination && (
                    <Directions
                      origin={userLocation}
                      destination={routeDestination}
                      onRouteCalculated={(duration, distance) => setRouteInfo({ duration, distance })}
                    />
                  )}
```

- [ ] **Step 6: Dibujar UI de info de ruta y botón en la tarjeta de detalle**

En `renderDetailsContent` de `MapView.tsx`:
```typescript
  const renderDetailsContent = (b: MapBranch) => {
    const results = getResultsForBranch(b.id);
    const hasImage = b.kiosk?.imageUrl && !failedImages[b.id];
    const isRouteActive = routeDestination && routeDestination.lat === b.lat && routeDestination.lng === b.lng;

    return (
      <>
        {/* Header / Photo Banner */}
        <div className="relative w-full h-28 lg:h-36 bg-gradient-to-br from-primary-500/10 to-primary-600/5 flex items-center justify-center overflow-hidden shrink-0">
          ...
        </div>

        {/* Content Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          <div>
            ...
          </div>

          {/* Walking Route Information */}
          {isRouteActive && routeInfo && (
            <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-xl text-[11px] font-bold border border-orange-100/30 flex items-center gap-1.5 animate-scale-in">
              <span>🚶 {routeInfo.duration} ({routeInfo.distance}) caminando</span>
            </div>
          )}

          {/* Action button */}
          <div className="flex gap-2 shrink-0">
            {!isRouteActive ? (
              <button
                onClick={() => setRouteDestination({ lat: b.lat, lng: b.lng })}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-md shadow-primary-500/10 cursor-pointer"
              >
                🚶 Cómo llegar caminando
              </button>
            ) : (
              <button
                onClick={() => { setRouteDestination(null); setRouteInfo(null); }}
                className="flex-1 py-2 border border-surface-200 text-surface-600 hover:bg-surface-50 font-bold text-[11px] rounded-xl transition-all cursor-pointer"
              >
                ❌ Cancelar Ruta
              </button>
            )}
          </div>

          {/* Stock Section */}
          ...
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/MapView.tsx
git commit -m "feat(map): integrate walking routes directions in MapView UI"
```
