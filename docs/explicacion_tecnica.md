# Explicación Técnica de la Arquitectura KioskStar

Este documento detalla de forma precisa dónde están ubicados los componentes clave del sistema, incluyendo números de líneas y explicaciones de fragmentos de código.

---

## 1. ¿Dónde está almacenada la API?
La API es el backend de la aplicación, organizada en el directorio `/backend`:
- **Punto de Entrada**: [index.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/index.ts) inicializa Express, configura los middlewares globales (CORS, JSON) y monta los routers.
- **Rutas (Endpoints)**: En `/backend/src/routes/` se asocian las URLs con los middlewares y controladores correspondientes:
  - Ejemplo: [sale.routes.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/routes/sale.routes.ts) define rutas como `/branch/:branchId`.
- **Controladores (Lógica)**: En `/backend/src/controllers/` se encuentra la lógica que interactúa con Prisma para responder las peticiones HTTP:
  - Ejemplo: [sale.controller.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/controllers/sale.controller.ts) procesa el cálculo del total de ventas y registra transacciones en la base de datos.
- **En producción**: Se ejecuta en un servidor Node.js independiente (por ejemplo, en Render) y en desarrollo corre en `http://localhost:3000`.

---

## 2. ¿Cómo se comunica con los servidores?
El frontend (`/frontend`) se comunica con el servidor a través de peticiones HTTP utilizando la biblioteca **Axios**, configurada en [api.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/services/api.ts):

- **Instanciación (Líneas 3-6)**:
  ```typescript
  const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
  });
  ```
- **Inyección de Token JWT (Líneas 9-15)**:
  Un interceptor añade de forma automática el header de autorización en cada petición saliente:
  ```typescript
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```
- **Manejo de Errores 401 (Líneas 18-34)**:
  Si una petición falla con un código `401 Unauthorized` (por ejemplo, si el token expira), se eliminan los datos de sesión locales y se despacha un evento para cerrar sesión sin recargar la página:
  ```typescript
  if (error.response?.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedBranch');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
  ```
- **Proxy en Desarrollo**: En `frontend/vite.config.ts`, Vite redirige las peticiones `/api/*` hacia `http://localhost:3000` para evitar limitaciones de CORS durante desarrollo.

---

## 3. ¿Cómo funciona el mapa en el frontend?
El mapa interactivo se encuentra en [MapView.tsx](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx):
- **Carga de API (Línea 55)**:
  ```typescript
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  ```
- **Offset del Centro del Mapa (Líneas 70-85)**:
  Para evitar que la tarjeta flotante de detalles tape al marcador del kiosco seleccionado, el centro se desplaza de forma dinámica:
  ```typescript
  const isLargeScreen = window.innerWidth >= 1024;
  if (isLargeScreen) {
    setMapCenter({ lat: b.lat, lng: b.lng - 0.0035 }); // Desplaza a la derecha
  } else {
    setMapCenter({ lat: b.lat - 0.0018, lng: b.lng }); // Desplaza hacia arriba
  }
  ```
- **Estructura y Superposición (Líneas 302-406)**:
  El mapa se renderiza en una caja con posicionamiento absoluto (`absolute inset-0`), y los paneles de detalles flotantes de escritorio y móviles se renderizan por encima con posicionamiento `absolute z-10` y se animan fluidamente usando GPU (`x` o `y` en Framer Motion).

---

## 4. ¿Cómo funciona la seguridad de la API en el programa?
La API asegura sus endpoints mediante tres middlewares que actúan en cascada:

1. **Middleware de Autenticación** ([auth.middleware.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/middlewares/auth.middleware.ts), Líneas 9-37):
   Extrae el JWT de la cabecera `Authorization`, lo verifica y guarda los datos decodificados en el objeto `req`:
   ```typescript
   const token = authHeader.split(' ')[1]; // formato 'Bearer <token>'
   const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: number; role: string; };
   req.userId = decoded.userId;
   req.userRole = decoded.role;
   ```
2. **Middleware de Roles** ([role.middleware.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/middlewares/role.middleware.ts), Líneas 4-22):
   Compara `req.userRole` con la lista de roles permitidos para ese endpoint. Si no es compatible, retorna un error `403 Forbidden`:
   ```typescript
   if (!allowedRoles.includes(req.userRole)) {
     res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
     return;
   }
   ```
3. **Middleware de Validación con Zod** ([validate.middleware.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/middlewares/validate.middleware.ts), Líneas 4-24):
   Valida el cuerpo de la petición (`req.body`) frente a un esquema de validación predefinido para garantizar la integridad y tipos correctos de los datos.

---

## 5. ¿Dónde se guardan los datos de las coordenadas para el mapa?
Las coordenadas geográficas están almacenadas de forma numérica persistente en la base de datos PostgreSQL:
- **Esquema de Base de Datos** ([schema.prisma](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/prisma/schema.prisma)):
  - En la tabla de **Kioscos** (Líneas 55-56):
    ```prisma
    model Kiosk {
      lat   Float
      lng   Float
    }
    ```
  - En la tabla de **Sucursales** (Líneas 73-74):
    ```prisma
    model Branch {
      lat   Float
      lng   Float
    }
    ```
- **Poblamiento de Datos** ([seed.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/prisma/seed.ts)):
  Durante el proceso de siembra de base de datos, las coordenadas se obtienen mediante la API de geocodificación de Google Maps (Líneas 3 y 276) y se persisten en el servidor PostgreSQL:
  ```typescript
  import { geocodeAddress } from '../src/services/maps.service';
  let coords = await geocodeAddress(fullAddress); // Retorna { lat, lng }
  ```
- **Visualización**: La API expone las coordenadas mediante el endpoint `GET /api/map/kiosks` para que el frontend pueda renderizar los marcadores en la ubicación geográfica exacta.
