# Spec de Diseño: Marcador de Ubicación Naranja y Botón de Recentrado

Implementar una visualización premium de la ubicación del usuario en el mapa utilizando la paleta de colores de KioskStar (naranja/primary) y añadir un botón de geolocalización flotante para centrar la vista.

## Componentes

### 1. Marcador de Ubicación del Usuario
- **Punto central:** Círculo sólido naranja (`bg-primary-500`) de `14px` con borde blanco y sombra.
- **Anillo de pulso:** Círculo exterior naranja (`bg-primary-400/30`) de `32px` con animación `animate-ping`.
- **Aura difuminada:** Círculo trasero estático de `48px` con opacidad baja y efecto `blur` para dar profundidad visual.
- **Posición:** Reemplazar el marcador azul anterior en [MapView.tsx](file:///c:/Users/feliv/Documents/Kioskstar-TPFINAL/frontend/src/pages/MapView.tsx).

### 2. Botón Flotante "Mi Ubicación"
- **Ubicación:** Posición absoluta sobre la esquina inferior derecha del mapa (`absolute right-4 bottom-24` en móvil/escritorio) para evitar tapar controles estándar de Google Maps.
- **Aestética:** Botón circular blanco con bordes redondeados (`rounded-xl`), bordes sutiles y sombra intensa.
- **Ícono:** Utilizar el componente `Navigation` o `Locate` de `lucide-react` en color naranja (`text-primary-650`).
- **Comportamiento:**
  - Al hacer clic, ejecuta `navigator.geolocation.getCurrentPosition`.
  - Actualiza el estado `userLocation` y el centro del mapa `mapCenter`.
  - Cambia el zoom a `15` para una vista enfocada de cercanía.
  - Muestra un toast de advertencia si los permisos de geolocalización están desactivados.

## Código Propuesto (Esquema)

```typescript
const recenterUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        setZoom(15);
        toast.success('Ubicación actualizada');
      },
      () => {
        toast.error('No se pudo acceder a tu ubicación. Activá el GPS.');
      }
    );
  } else {
    toast.error('Tu navegador no soporta geolocalización.');
  }
};
```

```tsx
{/* Botón Geolocalización */}
<button
  onClick={recenterUserLocation}
  className="absolute right-4 bottom-24 bg-white hover:bg-surface-50 border border-surface-200/80 rounded-xl p-2.5 shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer z-10 text-primary-600"
  title="Mi ubicación"
>
  <Locate size={18} />
</button>
```
