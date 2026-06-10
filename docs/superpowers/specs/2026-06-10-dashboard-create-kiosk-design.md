# Specification: Dashboard Kiosk Creation Option

## Goal
Provide Admin users who do not have a kiosk registered with a clear call-to-action (CTA) on the main dashboard to register their kiosk via a modal form.

---

## Proposed Changes

### Frontend Changes

#### Dashboard Component (`Dashboard.tsx`)
In `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\pages\Dashboard.tsx`:
- Import `toast` from `react-hot-toast` for success/error alerts.
- Declare new state variables:
  - `showCreateKioskModal` (boolean)
  - `createName` (string)
  - `createAddress` (string)
  - `createCity` (string, defaults to `'Concordia'`)
  - `createProvince` (string, defaults to `'Entre Ríos'`)
  - `createPostalCode` (string, defaults to `'3200'`)
- If the user is an `ADMIN` and `kiosk` is `null` (after compilation of `loadData()`), display a card prompting: *"No tenés un kiosco registrado. Registrá tu kiosco principal para comenzar..."* and a button *"+ Registrar mi Kiosco"*.
- Implement a modal overlay popup triggered by `showCreateKioskModal`.
- On submission, call `POST /api/kiosks` with form parameters. 
- On successful API response:
  - Call `loadData()` to refresh state.
  - Reset form inputs.
  - Close the modal.
  - Trigger `toast.success("Kiosco registrado exitosamente")`.
- On error response, trigger `toast.error(error_message)`.

---

## Verification Plan

### Automated Tests & Checks
- Run `npm run build` in `frontend/` to check for TypeScript compilation.

### Manual Verification
- Log in as an Admin who doesn't have a kiosk (or manually delete their kiosk temporarily from the DB).
- Navigate to the Dashboard. Verify the placeholder card is visible.
- Click the *"+ Registrar mi Kiosco"* button. Verify the modal pops up.
- Fill out the form and submit. Verify a success toast is shown and the dashboard transitions into the standard kiosk manager interface (with Mi Kiosco, invite codes, and branches).
