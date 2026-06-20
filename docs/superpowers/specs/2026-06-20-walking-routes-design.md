# Diseño: Trazado de Rutas Caminando en Mapa

Trazar ruta de caminata desde ubicación del usuario hasta el kiosco seleccionado o el más cercano al buscar un producto.

## Cambios Propuestos

### 1. Componente Directions (`frontend/src/components/Directions.tsx`)

Nuevo componente para encapsular lógica de la API de Google Maps:

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

### 2. Modificaciones en `MapView.tsx` (`frontend/src/pages/MapView.tsx`)

#### Nuevos Estados
```typescript
const [routeDestination, setRouteDestination] = useState<{ lat: number; lng: number } | null>(null);
const [routeInfo, setRouteInfo] = useState<{ duration: string; distance: string } | null>(null);
```

#### Búsqueda de Productos
En `performSearch`, al encontrar el sucursal más cercano:
```typescript
if (sortedBranches.length > 0) {
  setClosestBranchId(sortedBranches[0].id);
  setRouteDestination({ lat: sortedBranches[0].lat, lng: sortedBranches[0].lng });
}
```

#### Limpieza de Búsqueda y Cierre de Tarjeta
Limpiar la ruta cuando se limpia la búsqueda o se cierra el detalle del kiosco:
```typescript
setRouteDestination(null);
setRouteInfo(null);
```

#### Integración de UI (Tarjeta Detalles)
- Si la ruta hacia el kiosco seleccionado está activa, mostrar `routeInfo.duration` y `routeInfo.distance`.
- Mostrar botón *"Cómo llegar"* o *"Cancelar Ruta"* según corresponda.

---

## Plan de Verificación

### Pruebas Manuales
1. Buscar un producto en la barra de búsqueda y verificar que se traza la ruta azul de caminata hacia el kiosco más cercano automáticamente.
2. Seleccionar otro kiosco en el mapa y verificar que la ruta anterior se borra y aparece el botón *"Cómo llegar"*.
3. Clickear en *"Cómo llegar"* y verificar que se dibuja la ruta y muestra la duración/distancia estimada en la tarjeta.
4. Cerrar detalles o limpiar búsqueda y verificar que la línea de la ruta desaparece.
