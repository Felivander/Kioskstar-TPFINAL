# Especificación de Diseño: Cierre de Caja e Historial de Ventas

**Fecha:** 2026-06-15  
**Autor:** Antigravity  
**Estado:** Propuesto  

---

## 1. Contexto y Objetivos

El objetivo de este diseño es agregar el control de cajas (apertura y cierre de caja) en el módulo de ventas y un historial de ventas organizado por sesión de caja. Esto garantiza un control financiero riguroso, evitando descuadres de efectivo en el kiosco y organizando las ventas de forma clara.

### Requerimientos Clave
* **Control de Cajas Obligatorio**: Un empleado o administrador debe abrir la caja con un saldo inicial en efectivo para poder registrar ventas.
* **Cierre de Caja**: Al cerrar la caja, se debe ingresar el efectivo real contado. La aplicación comparará este saldo con el saldo esperado (inicial + ventas en efectivo) y registrará diferencias (sobrantes/faltantes).
* **Historial de Ventas Agrupado**: Visualizar el historial agrupado por sesión de caja (Cajas de hoy, ayer y días pasados), mostrando los detalles de las ventas e ítems de cada sesión.
* **Integración del Dashboard**: El widget de ventas del Dashboard debe enlazar al historial de ventas.

---

## 2. Modelo de Datos (Prisma Schema)

Introduciremos el modelo `CashSession` para registrar las sesiones de caja de cada sucursal:

```prisma
enum CashSessionStatus {
  OPEN
  CLOSED
}

model CashSession {
  id              Int               @id @default(autoincrement())
  branchId        Int
  openedById      Int
  closedById      Int?
  status          CashSessionStatus @default(OPEN)
  openingBalance  Float             // Efectivo inicial
  expectedBalance Float?            // Saldo esperado (saldo inicial + efectivo de ventas)
  actualBalance   Float?            // Saldo físico real contado
  notes           String?
  openedAt        DateTime          @default(now())
  closedAt        DateTime?

  branch   Branch  @relation(fields: [branchId], references: [id], onDelete: Cascade)
  openedBy User    @relation("OpenedSessions", fields: [openedById], references: [id])
  closedBy User?   @relation("ClosedSessions", fields: [closedById], references: [id])
  sales    Sale[]

  @@map("cash_sessions")
}

model Sale {
  // ... campos existentes
  cashSessionId Int?
  cashSession   CashSession? @relation(fields: [cashSessionId], references: [id], onDelete: SetNull)
}

model User {
  // ... campos existentes
  openedSessions CashSession[] @relation("OpenedSessions")
  closedSessions CashSession[] @relation("ClosedSessions")
}
```

---

## 3. Endpoints de la API (Backend)

Todos los endpoints requerirán autenticación y validación de esquemas (Zod).

### 3.1 `GET /api/cash-sessions/active/:branchId`
* **Descripción:** Devuelve la caja abierta actual de una sucursal, o `null` si está cerrada.
* **Respuesta (200):**
  ```json
  {
    "id": 42,
    "branchId": 1,
    "openedById": 3,
    "status": "OPEN",
    "openingBalance": 5000.0,
    "openedAt": "2026-06-15T08:30:00Z"
  }
  ```

### 3.2 `POST /api/cash-sessions/open`
* **Descripción:** Abre una sesión de caja.
* **Validación Zod:**
  ```typescript
  export const openCashSessionSchema = z.object({
    branchId: z.number().int().positive(),
    openingBalance: z.number().nonnegative("El saldo inicial debe ser mayor o igual a 0"),
  });
  ```
* **Lógica:** Valida que no haya otra caja abierta (`OPEN`) en la misma sucursal. Crea el registro de `CashSession` asociando `openedById = req.userId`.

### 3.3 `POST /api/cash-sessions/close`
* **Descripción:** Cierra la caja activa actual de una sucursal.
* **Validación Zod:**
  ```typescript
  export const closeCashSessionSchema = z.object({
    sessionId: z.number().int().positive(),
    actualBalance: z.number().nonnegative("El saldo final debe ser mayor o igual a 0"),
    notes: z.string().max(500).optional(),
  });
  ```
* **Lógica:**
  1. Busca la `CashSession` por `sessionId`. Debe estar en estado `OPEN`.
  2. Obtiene todas las ventas asociadas a la sesión (`cashSessionId = sessionId`).
  3. Calcula el total de efectivo cobrado:
     * Ventas con `paymentMethod = 'EFECTIVO'`: se suma el total de la venta.
     * Ventas con `paymentMethod = 'MIXTO'`: se suma el monto especificado con `method = 'EFECTIVO'` dentro del JSON de pagos.
  4. Calcula `expectedBalance = openingBalance + totalEfectivoCobrado`.
  5. Cambia el estado a `CLOSED`, asigna `closedById = req.userId`, `closedAt = new Date()`, guarda `expectedBalance`, `actualBalance` y calcula la diferencia.

### 3.4 `GET /api/cash-sessions/branch/:branchId`
* **Descripción:** Devuelve el historial de sesiones de caja de una sucursal con sus ventas asociadas ordenadas por fecha descendente.
* **Respuesta (200):** Lista de sesiones con ventas e ítems incluidos.

### 3.5 Modificación en `POST /api/sales`
* **Lógica:**
  * Busca una caja abierta (`status: 'OPEN'`) para la sucursal indicada (`branchId`).
  * Si no existe, lanza un error `400` indicando: *"La caja está cerrada. Debe abrir la caja para registrar ventas"*.
  * Si existe, asocia la venta guardando `cashSessionId` en la transacción de creación de la venta.

---

## 4. Diseño de la Interfaz (Frontend - `Sales.tsx`)

La página se dividirá en dos pestañas principales mediante un control de tabs en la parte superior:

### 4.1 Pestaña "Registrar Venta"
* **Verificación de Estado:** Al cargar, consulta el endpoint `/active/:branchId`.
* **Caja Cerrada (Formulario de Apertura):**
  * Bloquea la búsqueda de productos y el carrito.
  * Muestra una tarjeta central para ingresar el efectivo inicial de apertura y el botón "Abrir Caja".
* **Caja Abierta (Punto de Venta):**
  * Desbloquea la interfaz normal de ventas.
  * Arriba de todo muestra una barra fija con:
    * Estado de la caja y datos de apertura.
    * Saldo actual acumulado de ventas.
    * Botón "Cerrar Caja".
* **Modal de Cierre de Caja:**
  * Pide ingresar el efectivo real en caja.
  * Muestra una previsualización interactiva de descuadre: *"Efectivo Esperado: $X.00 | Efectivo Real: $Y.00 | Diferencia: $Z.00"*.
  * Botón para confirmar el cierre definitivo.

### 4.2 Pestaña "Historial de Caja"
* Carga el historial de cajas y despliega tarjetas por sesión (Día de hoy, ayer, etc.).
* Las tarjetas cerradas muestran resumido el saldo inicial, recaudado y la diferencia en rojo (si hay faltante) o verde (si hay sobrante).
* Cada tarjeta es expandible y lista las ventas realizadas en esa sesión con su desglose de productos y métodos de pago.

### 4.3 Navegación desde el Dashboard
* En `Dashboard.tsx`, al hacer clic en el widget de ventas, redirigirá a la pestaña de historial:
  ```typescript
  navigate('/sales', { state: { activeTab: 'history' } });
  ```
* En `Sales.tsx`, inicializaremos el estado del tab activo leyendo `location.state?.activeTab` o por defecto `register`.

---

## 5. Plan de Verificación

### Pruebas Unitarias y de Integración (Backend)
* Crear una sesión de caja y verificar que se guarde en base de datos.
* Validar que no se puedan crear dos sesiones abiertas simultáneamente en la misma sucursal.
* Validar que no se puedan registrar ventas si la caja está cerrada.
* Registrar ventas en efectivo y mixtas y comprobar que el cálculo de `expectedBalance` sea correcto en el cierre.

### Verificación Manual (Frontend)
* Entrar a Ventas con caja cerrada y verificar el bloqueo y flujo de apertura.
* Realizar una venta en efectivo y otra mixta y comprobar que el total acumulado en la barra informativa aumente correspondientemente.
* Cerrar la caja con diferencia positiva, negativa y neutra y comprobar los colores e información registrada en el historial.
* Hacer clic en el widget de ventas del Dashboard y validar la redirección automática a la pestaña de historial.
