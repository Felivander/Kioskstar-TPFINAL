# Integración de Mapas y Rutas en KioskStar

Este documento explica en detalle cómo funciona la integración de Google Maps en la plataforma KioskStar. Cubre el flujo general del sistema, la configuración de la API, el cálculo de distancias (Haversine), el cálculo de rutas peatonales con tiempos estimados y el almacenamiento de coordenadas en la base de datos.

---

## 1. Resumen del Funcionamiento General

El módulo de mapas de KioskStar opera bajo una arquitectura distribuida donde el backend realiza los filtros espaciales preliminares y el frontend realiza el renderizado visual e interactivo de mapas y rutas:

1. **Geolocalización del Cliente:** Al ingresar al mapa, el frontend obtiene la ubicación del dispositivo del cliente (GPS/IP) y la guarda en el estado de React.
2. **Filtro y Búsqueda por Distancia (Backend):** 
   - El cliente consulta sucursales cercanas o busca un producto en particular.
   - El backend consulta las sucursales en la base de datos PostgreSQL, calcula la distancia en línea recta hacia cada una usando la **Fórmula de Haversine** y devuelve el listado ordenado del más cercano al más lejano.
3. **Renderizado del Mapa e Indicadores (Frontend):**
   - El frontend dibuja los marcadores en el mapa usando `@vis.gl/react-google-maps`.
   - Se resalta visualmente con un efecto de "fuego" (aura naranja y rosa pulsante) el kiosco destacado más cercano.
4. **Cálculo y Trazado de Rutas (Frontend):**
   - Cuando se realiza una búsqueda de producto exitosa, el sistema calcula y dibuja **automáticamente** la ruta de caminata desde el cliente hasta la sucursal más cercana que posee stock.
   - Alternativamente, el cliente puede seleccionar cualquier sucursal en el mapa y presionar el botón **"Cómo llegar caminando"** para iniciar el cálculo.
   - El frontend invoca al servicio `DirectionsService` de Google Maps, recibe la polilínea del camino real por las calles y la renderiza en el mapa con un color **naranja personalizado**. Asimismo, muestra en la tarjeta informativa el tiempo estimado de viaje (ej. *"12 min"*) y la distancia real a recorrer (ej. *"950 m"*).

---

## 2. Integración de la API en la Aplicación

La integración de Google Maps se realiza a nivel del frontend utilizando el wrapper oficial de Google para React: `@vis.gl/react-google-maps`.

- **Proveedor global de mapas:** Todo el componente del mapa se envuelve dentro de un `<APIProvider>` que inyecta los scripts de Google Maps de manera asíncrona utilizando una clave de API (`VITE_GOOGLE_MAPS_API_KEY`).
- **Componente del Mapa:** Se renderiza `<GoogleMap>` configurando los parámetros por defecto del mapa (zoom, coordenadas iniciales de centrado, deshabilitación de la UI nativa para una interfaz más limpia, y el estilo propio).

---

## 3. Cálculo de Distancia entre el Cliente y el Kiosco (Backend)

Para optimizar el rendimiento y evitar llamadas innecesarias a la API paga de Google Maps por cada kiosco existente, la distancia inicial de ordenamiento (en línea recta) se calcula directamente en el backend en memoria usando la **Fórmula de Haversine**. 

Esta fórmula matemática determina la distancia geodésica entre dos puntos en la superficie de una esfera (la Tierra) a partir de sus latitudes y longitudes:

$$\Delta \text{lat} = \text{lat}_2 - \text{lat}_1$$
$$\Delta \text{lng} = \text{lng}_2 - \text{lng}_1$$
$$a = \sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\Delta \text{lng}}{2}\right)$$
$$c = 2 \cdot \arctan2\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c \quad (\text{donde } R = 6371\text{ km})$$

### En el Backend:
1. El controlador recibe la latitud/longitud del cliente como parámetros de consulta (`query params`).
2. Obtiene las sucursales de la base de datos.
3. Aplica la fórmula sobre cada una para obtener la distancia en kilómetros.
4. Filtra por un radio (por ejemplo, 50 km) y ordena el listado ascendentemente por distancia (`sort((a, b) => a.distance - b.distance)`).

---

## 4. Cálculo y Trazado de Rutas y Tiempos de Caminata (Frontend)

Para obtener la ruta exacta navegable por calles peatonales y el tiempo real estimado de caminata, el frontend interactúa directamente con los servicios de Google Maps. Esto se realiza a través de un componente auxiliar denominado `Directions.tsx`.

### Cómo Funciona:
1. **Instanciación de Servicios:** Al montarse el componente, utiliza el hook `useMapsLibrary('routes')` para cargar dinámicamente la librería de rutas e instanciar:
   - `google.maps.DirectionsService`: Para realizar peticiones de cálculo de rutas a los servidores de Google.
   - `google.maps.DirectionsRenderer`: Para dibujar el trazado de la ruta sobre el mapa.
2. **Personalización Visual:** El renderizador se inicializa con `suppressMarkers: true` (para no duplicar los marcadores personalizados del cliente y los kioscos) y estilos personalizados de polilínea en color naranja:
   - `strokeColor: '#f97316'` (Color naranja de Tailwind)
   - `strokeOpacity: 0.8`
   - `strokeWeight: 6` (Grosor de la línea)
3. **Petición de Ruta (Modo Caminando):** El componente observa los cambios en `origin` y `destination`. Si ambos existen, ejecuta:
   ```typescript
   directionsService.route({
     origin,
     destination,
     travelMode: google.maps.TravelMode.WALKING // Fuerza el modo peatonal
   }, (result, status) => { ... })
   ```
4. **Extracción de Datos:** Al recibir una respuesta exitosa (`status === 'OK'`), el componente:
   - Llama a `directionsRenderer.setDirections(result)` para dibujar la línea en el mapa.
   - Extrae de la primera sección de la ruta (`routes[0].legs[0]`) los textos descriptivos de la duración real (`leg.duration.text`) y la distancia real por calles (`leg.distance.text`).
   - Envía esta información al componente padre (`MapView.tsx`) mediante un callback (`onRouteCalculated`) para actualizar la UI.

---

## 5. Almacenamiento de Datos de Coordenadas (Base de Datos)

Las coordenadas geográficas (latitud y longitud) son persistidas en una base de datos PostgreSQL utilizando el ORM **Prisma**.

Se almacenan con el tipo `Float` (que mapea a un número decimal de doble precisión `double precision` en PostgreSQL) tanto en el modelo de Kioscos como en el de Sucursales:

- **Kiosk (`kiosks`):** Guarda la ubicación del comercio principal.
- **Branch (`branches`):** Guarda la ubicación exacta de cada sucursal individual. El mapa lee las sucursales para ubicar los puntos de venta y calcular distancias.

---

## 6. Mapa del Código (Estructura de Carpetas y Líneas)

A continuación se detallan las carpetas, archivos y líneas de código exactas donde se implementan estas funcionalidades:

| Componente | Archivo | Líneas | Descripción |
| :--- | :--- | :--- | :--- |
| **Modelado de Base de Datos** | [schema.prisma](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/backend/prisma/schema.prisma) | `57-58` | Campos `lat` y `lng` de tipo `Float` en el modelo `Kiosk`. |
| | [schema.prisma](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/backend/prisma/schema.prisma) | `75-76` | Campos `lat` y `lng` de tipo `Float` en el modelo `Branch`. |
| **Controlador de Distancias (Backend)** | [map.controller.ts](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/backend/src/controllers/map.controller.ts) | `4-32` | Endpoint `getKiosksNearby`: Obtiene sucursales en un radio específico filtrando con Haversine. |
| | [map.controller.ts](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/backend/src/controllers/map.controller.ts) | `34-66` | Endpoint `searchProductInMap`: Busca productos en stock y ordena las sucursales por cercanía (Haversine). |
| **Servicio de Mapas (Backend)** | [maps.service.ts](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/backend/src/services/maps.service.ts) | `4-36` | Función `geocodeAddress`: Convierte direcciones de texto a coordenadas `{ lat, lng }` mediante la API de Geocoding de Google. |
| | [maps.service.ts](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/backend/src/services/maps.service.ts) | `38-45` | Función `calculateDistance`: Implementación utilitaria reutilizable de la fórmula de Haversine. |
| **Componente de Trazado (Frontend)** | [Directions.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/components/Directions.tsx) | `1-67` | Componente completo que maneja el `DirectionsService` y `DirectionsRenderer`. |
| | [Directions.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/components/Directions.tsx) | `20-28` | Inicialización del renderer con opciones de color naranja (`#f97316`) y grosor `6`. |
| | [Directions.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/components/Directions.tsx) | `38-55` | Solicitud de ruta en modo `WALKING` y callback con tiempo/distancia calculados. |
| **Gestión de la UI de Mapas (Frontend)** | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `6-6` | Importación del componente `Directions`. |
| | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `90-91` | Definición de estados `routeDestination` y `routeInfo`. |
| | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `203-209` | **Ruta Automática:** Dibuja la ruta al kiosco con stock disponible más cercano al completar una búsqueda exitosa. |
| | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `307-312` | Muestra la duración y distancia estimada de caminata en la tarjeta detallada. |
| | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `314-331` | **Ruta Manual:** Botones para trazar ruta de caminata manualmente ("Cómo llegar caminando") o cancelar el trazado activo. |
| | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `399-469` | Inicialización de `<APIProvider>` con la clave de API y el componente `<GoogleMap>`. |
| | [MapView.tsx](file:///c:/Users/Felipe/Documents/IDEAS/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx) | `409-415` | Inyección del componente `<Directions>` dentro del árbol del mapa. |
