# 🗺️ Integración de Google Maps en KioskStar

## Resumen

KioskStar usa Google Maps para mostrar un mapa interactivo donde los usuarios pueden:
- Ver todas las sucursales de kioscos cercanas a su ubicación.
- Buscar un producto y ver en qué kioscos está disponible, ordenados por distancia.

La integración combina la **Google Maps JavaScript API** (en el frontend) con cálculos de distancia Haversine hechos en el **backend** con Prisma + PostgreSQL.

---

## Stack de la integración

| Capa | Tecnología | Rol |
|---|---|---|
| Frontend | `@vis.gl/react-google-maps` v1.8 | Wrapper React para Google Maps JS API |
| Frontend | `navigator.geolocation` (Web API nativa) | Obtener ubicación del usuario |
| Backend | Fórmula Haversine (puro JS/TS) | Calcular distancias entre coordenadas |
| Backend | Prisma + PostgreSQL | Almacenar `lat` y `lng` de cada sucursal |
| Config | `VITE_GOOGLE_MAPS_API_KEY` | API Key expuesta al frontend vía Vite |
| Config | `GOOGLE_MAPS_API_KEY` | API Key en backend (para geocoding, pendiente) |

---

## Configuración de la API Key

### 1. Frontend — `frontend/.env`

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...tu_clave_aqui
```

Vite expone automáticamente las variables con prefijo `VITE_` al bundle. En el código:

```ts
// frontend/src/pages/MapView.tsx (línea 31)
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
```

Si la variable está vacía, el mapa **no se renderiza** y muestra un mensaje de error amigable al usuario.

### 2. Backend — `backend/.env`

```env
GOOGLE_MAPS_API_KEY=AIzaSy...tu_clave_aqui
```

Esta clave se usa para el servicio de **geocoding** (convertir una dirección en coordenadas lat/lng). Actualmente está declarada pero la implementación está pendiente.

---

## Arquitectura del flujo de datos

```
Navegador                    Frontend (React)               Backend (Express)         PostgreSQL
   │                              │                               │                       │
   │── GPS coords ───────────────▶│                               │                       │
   │   navigator.geolocation      │                               │                       │
   │                              │── GET /api/map/kiosks ───────▶│                       │
   │                              │   ?lat=...&lng=...&radius=50  │── prisma.branch.find ─▶│
   │                              │                               │◀─ branches con lat/lng─│
   │                              │                               │                       │
   │                              │                               │ Filtra con Haversine   │
   │                              │◀─ [{ id, name, lat, lng }] ───│                       │
   │                              │                               │                       │
   │◀── Mapa con markers ─────────│                               │                       │
```

---

## Endpoints del backend

### `GET /api/map/kiosks`

Devuelve todas las sucursales dentro de un radio (km) de las coordenadas dadas.

**Query params:**
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `lat` | float | `0` | Latitud del usuario |
| `lng` | float | `0` | Longitud del usuario |
| `radius` | float | `10` | Radio de búsqueda en km |

**Lógica interna** en `backend/src/controllers/map.controller.ts`:

```ts
// Trae TODAS las sucursales con su kiosko padre
const branches = await prisma.branch.findMany({
  include: { kiosk: { select: { id: true, name: true, address: true } } },
});

// Filtra en memoria con Haversine
const nearby = branches.filter((b) => {
  const dLat = ((b.lat - userLat) * Math.PI) / 180;
  const dLng = ((b.lng - userLng) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + ...;
  const distance = 6371 * 2 * Math.atan2(...); // km
  return distance <= searchRadius;
});
```

> El filtrado se hace **en memoria** en Node.js, no en SQL. Para datasets grandes (> 10k sucursales) se recomienda migrar a PostGIS o la extensión `earthdistance` de PostgreSQL.

---

### `GET /api/map/search`

Busca sucursales que tengan stock de un producto dado, ordenadas por distancia.

**Query params:**
| Param | Tipo | Descripción |
|---|---|---|
| `product` | string | Nombre parcial del producto (case-insensitive) |
| `lat` | float | Latitud del usuario |
| `lng` | float | Longitud del usuario |

**Lógica:**

```ts
const stockEntries = await prisma.stock.findMany({
  where: {
    quantity: { gt: 0 },  // solo con stock disponible
    product: { name: { contains: productName, mode: 'insensitive' } }
  },
  include: { product: true, branch: { include: { kiosk: true } } },
});

// Calcula distancia y ordena de más cercano a más lejano
const results = stockEntries
  .map((s) => ({ ...s, distance: haversine(userLat, userLng, s.branch.lat, s.branch.lng) }))
  .sort((a, b) => a.distance - b.distance);
```

**Respuesta:** array de `StockEntry` con campo extra `distance` (en km).

---

## Componentes del frontend

### Archivo principal: `frontend/src/pages/MapView.tsx`

#### Geolocalización del navegador

Al montar el componente, pide la ubicación real del usuario:

```ts
useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      setMapCenter(loc);
    });
  }
}, []);
```

Si el usuario rechaza el permiso, se usa el centro por defecto: **Concordia, Entre Ríos** (`-31.3929, -58.0207`).

#### Árbol de componentes del mapa

```
<APIProvider apiKey={API_KEY}>          ← Inicializa Google Maps SDK
  <GoogleMap
    center={mapCenter}
    defaultZoom={13}
    mapId="kioskstar-map"               ← Cloud-based map styling (opcional)
    gestureHandling="greedy"            ← Scroll con un dedo en mobile
  >
    <AdvancedMarker position={userLocation}>   ← Punto azul pulsante (tu ubicación)
      <div className="animate-pulse bg-blue-500 rounded-full" />
    </AdvancedMarker>

    {branches.map(b =>
      <AdvancedMarker
        position={{ lat: b.lat, lng: b.lng }}
        onClick={() => setSelectedBranch(b)}   ← Abre InfoWindow
      >
        {/* Marker normal 🏪 o especial 🔥 si es el más cercano */}
      </AdvancedMarker>
    )}

    {selectedBranch && (
      <InfoWindow position={...} onCloseClick={...}>
        {/* Nombre, dirección, distancia, productos con precio y cantidad */}
      </InfoWindow>
    )}

  </GoogleMap>
</APIProvider>
```

#### Lógica del "más cercano" 🔥

Cuando el usuario busca un producto, el resultado con menor `distance` recibe `closestBranchId`. Ese marker se renderiza con un efecto visual de fuego (`radial-gradient` animado + `animate-ping`) y aparece destacado en el listado lateral con la etiqueta **"MÁS CERCANO"**.

---

## Fórmula Haversine

Implementada en dos lugares:

1. **`backend/src/services/maps.service.ts`** — función reutilizable `calculateDistance(lat1, lng1, lat2, lng2)`.
2. **`backend/src/controllers/map.controller.ts`** — inline en los dos endpoints.

```ts
// Radio terrestre = 6371 km
const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLng = ((lng2 - lng1) * Math.PI) / 180;
const a =
  Math.sin(dLat / 2) ** 2 +
  Math.cos((lat1 * Math.PI) / 180) *
  Math.cos((lat2 * Math.PI) / 180) *
  Math.sin(dLng / 2) ** 2;
const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
```

---

## Estado actual

| Funcionalidad | Estado | Notas |
|---|---|---|
| Mapa interactivo con markers | ✅ Implementado | Requiere API Key en `frontend/.env` |
| Geolocalización del usuario | ✅ Implementado | Usa Web API nativa del navegador |
| Filtro por radio (Haversine) | ✅ Implementado | En memoria, no SQL |
| Búsqueda de producto en mapa | ✅ Implementado | Con sort por distancia |
| InfoWindow con stock | ✅ Implementado | Muestra cantidad y precio |
| Marker "más cercano" 🔥 | ✅ Implementado | Efecto visual animado |
| Geocoding dirección → lat/lng | ⏳ Pendiente | `maps.service.ts` retorna `null` actualmente |
| Directions API (rutas) | ⏳ Pendiente | No implementado |

---

## Cómo activar el mapa

### Paso 1: Obtener la API Key

1. Ir a [Google Maps Platform](https://console.cloud.google.com/google/maps-apis).
2. Crear un proyecto y habilitar estas APIs:
   - **Maps JavaScript API** — para el mapa en el frontend.
   - **Geocoding API** — para convertir direcciones (backend, pendiente).
3. Crear una credencial de tipo **API Key**.
4. Restringirla por dominio (producción) o dejarla sin restricción (desarrollo local).

### Paso 2: Configurar las variables de entorno

```bash
# frontend/.env  (crear este archivo si no existe)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# backend/.env
GOOGLE_MAPS_API_KEY=AIzaSy...
```

> ⚠️ No committees nunca la API Key real al repositorio. Verificá que `.env` esté en `.gitignore`.

### Paso 3: Reiniciar el servidor de frontend

```bash
cd frontend
npm run dev
```

Vite recargará las variables de entorno y el mapa aparecerá automáticamente en `/map`.

---

## Próximos pasos sugeridos

1. **Implementar geocoding** en `maps.service.ts` para auto-completar `lat`/`lng` al crear kioscos/sucursales desde la dirección.
2. **Migrar filtro a SQL** con PostGIS (`ST_DWithin`) para escalar a grandes volúmenes.
3. **Directions API**: mostrar la ruta desde el usuario hasta el kiosco seleccionado.
4. **Places API**: autocompletar la barra de búsqueda de productos con sugerencias.
