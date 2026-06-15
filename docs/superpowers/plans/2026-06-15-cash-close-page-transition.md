# Cierre de Caja con Transición a Página de Arqueo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the cash drawer closing flow to show a confirmation modal first. If confirmed, transition to a dedicated full-page cash audit (arqueo) view instead of a modal. Upon submitting the audit, close the register and redirect to the History tab.

**Architecture:** Update `frontend/src/pages/Sales.tsx` to handle a confirmation modal, manage a new full-page sub-view state (`activeTab === 'arqueo'`), display the bill counting spreadsheet on this full page, and redirect to the `'history'` tab on successful completion.

**Tech Stack:** React, Tailwind CSS, Redux Toolkit

---

### Task 1: Update Page States & Confirmation Modal in Sales.tsx

**Files:**
- Modify: `frontend/src/pages/Sales.tsx`

- [ ] **Step 1: Replace states and close modal with confirmation modal**

Open `frontend/src/pages/Sales.tsx`. 
We will change `showCloseModal` to control the confirmation modal.
We will add a new state `activeTab` value: `'arqueo'`.

Find the closing modal state and denominations (around lines 48-54):
```typescript
  // Closing session / Arqueo state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10];
  const [billCounts, setBillCounts] = useState<Record<number, string>>({
    20000: '', 10000: '', 2000: '', 1000: '', 500: '', 200: '', 100: '', 50: '', 20: '', 10: ''
  });
```

Keep these states, but use `showCloseModal` specifically for the small confirmation dialog. When the user confirms in the modal, we set `activeTab` to `'arqueo'` and close the confirmation modal.

- [ ] **Step 2: Replace the Close Caja Modal block with Confirmation Modal**

Locate the modal render block in `Sales.tsx` (around lines 613-726):
```tsx
      {/* CLOSE CAJA MODAL (WITH DETAILED ARQUEO BILL COUNTER) */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          ...
        </div>
      )}
```

Replace it with a clean, simple confirmation modal:
```tsx
      {/* CONFIRMATION CLOSE MODAL */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-surface-200/60 w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-surface-950">¿Cerrar Caja Actual?</h3>
              <p className="text-xs text-surface-500 mt-2">
                ¿Estás seguro de cerrar la caja #{activeSession.id}? Para completar el cierre de tu turno, deberás realizar el arqueo físico de billetes en la siguiente pantalla.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-200 text-surface-600 font-bold text-xs hover:bg-surface-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseModal(false);
                  setActiveTab('arqueo');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-500/10"
              >
                Sí, ir al Arqueo
              </button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 3: Verify and Commit**

Verify compilation and commit.
```bash
git add frontend/src/pages/Sales.tsx
git commit -m "feat: replace detailed close modal with simple close confirmation modal"
```

---

### Task 2: Implement Full-Page Arqueo View in Sales.tsx

**Files:**
- Modify: `frontend/src/pages/Sales.tsx`

- [ ] **Step 1: Add the `'arqueo'` conditional render view**

Open `frontend/src/pages/Sales.tsx`. 
Look at the tab conditional rendering in the return block:
```tsx
      ) : activeTab === 'register' ? (
        /* TAB: REGISTRAR VENTA */
```

We will insert `activeTab === 'arqueo'` condition to render the full-page cash audit view.
Under `activeTab === 'arqueo'`, render the interactive bill counting spreadsheet layout. 
When the user submits the form, it executes `handleCloseCaja` and redirects to `'history'` on success:
```typescript
    if (closeCashSession.fulfilled.match(result)) {
      toast.success('Caja cerrada con éxito');
      setActiveTab('history'); // Redirigir al historial
      setBillCounts({ 20000: '', 10000: '', 2000: '', 1000: '', 500: '', 200: '', 100: '', 50: '', 20: '', 10: '' });
      setClosingNotes('');
      if (branchId) dispatch(fetchActiveSession(branchId));
    }
```

Replace return block tabs router section to support `arqueo` tab:
```tsx
      ) : activeTab === 'arqueo' ? (
        /* VISTA COMPLETA: ARQUEO DE CAJA */
        activeSession ? (
          <div className="bg-white rounded-3xl border border-surface-200/60 p-6 shadow-md animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-surface-100 mb-6">
              <h2 className="text-xl font-bold text-surface-950 flex items-center gap-2">
                💵 Planilla de Arqueo y Cierre: Caja #{activeSession.id}
              </h2>
              <button 
                type="button" 
                onClick={() => setActiveTab('register')} 
                className="px-3 py-1.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-surface-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                Volver a Ventas
              </button>
            </div>

            {sessionError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-650 text-xs font-semibold">
                ⚠️ {sessionError}
              </div>
            )}

            <form onSubmit={handleCloseCaja} className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
              {/* Planilla de Arqueo (Billetes) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-surface-50 p-4 rounded-2xl border border-surface-150">
                  <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Planilla de Recuento Físico</h4>
                  <p className="text-[10px] text-surface-400 mt-0.5">Ingresá la cantidad de billetes contados por denominación.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {DENOMINATIONS.map((denom) => {
                    const count = parseInt(billCounts[denom]) || 0;
                    const subtotal = count * denom;
                    return (
                      <div key={denom} className="flex items-center justify-between p-3 rounded-xl bg-surface-50/50 border border-surface-150 hover:border-primary-200/60 transition-colors">
                        <span className="text-sm font-bold text-surface-800 w-24">${denom.toLocaleString()}</span>
                        <input
                          type="number"
                          min="0"
                          value={billCounts[denom]}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseInt(val) >= 0)) {
                              setBillCounts(prev => ({ ...prev, [denom]: val }));
                              dispatch(clearSessionError());
                            }
                          }}
                          placeholder="0"
                          className="w-24 text-center px-3 py-1.5 rounded-lg border border-surface-250 bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm font-bold text-surface-700 text-right w-28">${subtotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen de Arqueo */}
              <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="bg-surface-50/50 border border-surface-200/50 p-5 rounded-2xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Resultado de Conciliación</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between font-semibold text-surface-500">
                      <span>Saldo Inicial</span>
                      <span>${activeSession.openingBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-surface-500 pb-2 border-b border-surface-200">
                      <span>Efectivo Esperado</span>
                      <span className="text-surface-700 font-bold">${expectedBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-surface-950 text-sm pt-1.5">
                      <span>Total Contado</span>
                      <span className="text-primary-600">${computedActualBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-surface-500 pt-1">
                      <span>Diferencia</span>
                      <span className={`font-bold ${computedActualBalance - expectedBalance >= 0 ? 'text-green-600' : 'text-red-650'}`}>
                        ${(computedActualBalance - expectedBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-surface-700">
                    Notas de Cierre (Opcional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Diferencias detectadas, observaciones de turnos, etc..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="flex-1 py-3 rounded-xl border-2 border-surface-200 text-surface-600 font-bold text-xs hover:bg-surface-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-500/10"
                  >
                    Confirmar Cierre de Caja
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-surface-200 shadow-sm">
            <span className="text-5xl block mb-3">⚠️</span>
            <p className="text-surface-500 font-medium">No hay caja activa para cerrar</p>
            <button onClick={() => setActiveTab('register')} className="mt-4 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-650 font-bold text-xs rounded-xl cursor-pointer">
              Volver a Ventas
            </button>
          </div>
        )
```

- [ ] **Step 2: Run a build compilation check**

`cmd.exe /c "set PATH=%PATH%;C:\Program Files\nodejs&& npm run build"` inside `frontend/` directory to verify compile success.

- [ ] **Step 3: Commit updates**

```bash
git add frontend/src/pages/Sales.tsx
git commit -m "feat: implement full-page dedicated cash audit (arqueo) layout view"
```
