# Explicación Técnica de la Arquitectura KioskStar

Este documento explica de forma simple y concisa el funcionamiento técnico de la API, la comunicación cliente-servidor, la integración del mapa en el frontend, la seguridad de los endpoints y el almacenamiento de coordenadas.

---

## 1. ¿Dónde está almacenada la API?
La API (el backend del sistema) está almacenada y estructurada en el directorio `/backend` del monorepo:
- **Tecnologías**: Construida con **Node.js**, **Express 5** y **TypeScript**.
- **Entrada del Servidor**: El archivo de inicio es [index.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/index.ts).
- **Rutas y Controladores**:
  - Las rutas (endpoints) se definen en `/backend/src/routes/` (por ejemplo, [sale.routes.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/routes/sale.routes.ts)).
  - La lógica de negocio y las respuestas a las peticiones se manejan en los controladores dentro de `/backend/src/controllers/` (por ejemplo, [sale.controller.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/controllers/sale.controller.ts)).
- **En producción**: Se despliega en servicios en la nube (como Render) y se conecta a una base de datos PostgreSQL. En desarrollo, corre localmente en el puerto `3000` (`http://localhost:3000`).

---

## 2. ¿Cómo se comunica con los servidores?
El frontend (`/frontend`) se comunica con el servidor de la API a través del protocolo HTTP (REST) utilizando la biblioteca **Axios**:
- **Configuración centralizada**: En [api.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/services/api.ts) se crea la instancia de Axios con la URL base de la API.
- **Intercepetor de Peticiones**: Cada vez que el frontend hace una llamada, un interceptor automático lee el token JWT del `localStorage` y lo adjunta en la cabecera HTTP `Authorization: Bearer <token>`.
- **Interceptor de Respuestas**: Si el servidor responde con un código `401 Unauthorized` (sesión expirada o inválida), el interceptor redirige automáticamente al usuario a `/login` y borra los datos de sesión locales.
- **Proxy de Desarrollo**: Durante el desarrollo local, Vite utiliza una regla de proxy en `vite.config.ts` para desviar las peticiones `/api/*` hacia `http://localhost:3000`, evitando problemas de CORS.

---

## 3. ¿Cómo funciona el mapa en el frontend?
El mapa interactivo está implementado en la vista [MapView.tsx](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx):
- **Biblioteca**: Utiliza `@vis.gl/react-google-maps`, que es la integración oficial de React para la API de JavaScript de Google Maps.
- **Carga de API**: El componente principal de la aplicación se envuelve en un `<APIProvider apiKey={...}>` usando la API Key de Google Maps guardada en variables de entorno.
- **Componentes del Mapa**:
  - `<GoogleMap>`: Renderiza el contenedor del mapa con controles de zoom y gestos táctiles.
  - `<AdvancedMarker>`: Ubica marcadores visuales para la ubicación del usuario (punto azul) y de cada sucursal de kiosco disponible en Concordia.
- **Interacción y Desplazamiento**: Al seleccionar una sucursal, la cámara se mueve y aplica un desplazamiento (offset) en las coordenadas (`lng - 0.0035` en computadoras o `lat - 0.0018` en celulares) para evitar que el marcador seleccionado quede oculto debajo de la tarjeta flotante de detalles.
- **Animaciones**: La tarjeta de detalles se superpone flotando arriba del mapa y entra/sale con transiciones suavizadas mediante `framer-motion`.

---

## 4. ¿Cómo funciona la seguridad de la API en el programa?
La seguridad del sistema está estructurada en tres capas consecutivas dentro del backend:
1. **Autenticación (JWT)**:
   - Al iniciar sesión, el servidor genera un JSON Web Token (JWT) firmado.
   - El middleware `authMiddleware` ([auth.middleware.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/middlewares/auth.middleware.ts)) valida este token en cada petición. Si es correcto, extrae el `userId` y `userRole` y los adjunta a la solicitud.
2. **Autorización basada en Roles (RBAC)**:
   - El middleware `roleMiddleware` ([role.middleware.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/middlewares/role.middleware.ts)) verifica si el rol del usuario autenticado (ADMIN, EMPLEADO, CLIENTE) tiene permiso para acceder a ese recurso. Por ejemplo, solo administradores y empleados pueden modificar stock o registrar ventas.
3. **Validación de Datos (Zod)**:
   - El middleware `validate` ([validate.middleware.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/src/middlewares/validate.middleware.ts)) intercepta los payloads JSON y valida que coincidan exactamente con los esquemas de datos estructurados en `/backend/src/schemas/` antes de que la petición llegue al controlador, previniendo inyecciones de datos maliciosos o inconsistentes.

---

## 5. ¿Dónde se guardan los datos de las coordenadas para el mapa?
Las coordenadas geográficas (latitud y longitud) de los kioscos y sucursales se guardan persistentemente en la base de datos relacional **PostgreSQL**:
- **Esquema de Prisma**: En la definición del modelo en [schema.prisma](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/prisma/schema.prisma), las tablas `Kiosk` y `Branch` tienen campos de tipo Float de precisión doble (`lat` y `lng`).
- **Geocodificación Automática**: Al ejecutar el script de siembra ([seed.ts](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/backend/prisma/seed.ts)), las direcciones textuales de Concordia se envían a la API de Geocoding de Google Maps, la cual devuelve la latitud y longitud exacta. Estas coordenadas calculadas se guardan en la base de datos.
- **Consumo**: Cuando el usuario entra al mapa, el frontend solicita las sucursales al backend (`GET /api/map/kiosks`) y este realiza una consulta a la base de datos devolviendo las coordenadas guardadas en formato JSON para pintar los marcadores.
