# Registro de Cambios — Revisión y mejoras de UI

> Sesiones del 2026-06-10 y 2026-06-12 · Branch: `mar`

---

## 0. Rediseño del landing de Rack (2026-06-12) ✅ APLICADO

`src/rack/RackLanding.tsx` + `src/rack/RackLanding.css` — reescritos según spec de 3 bloques:

| Bloque | Cambio |
|---|---|
| **1 · Hero (comprar)** | Micro-texto "PRE-OWNED + ARTESANAL · GDL, MX" movido arriba del logo en letras pequeñas; logo RACK gigante con destellos (sin cambios); tagline "Piezas con historia. Hechas a mano o de segunda vida."; CTA **sólido morado** `[ EXPLORAR RACK → ]` (antes era blanco); indicador sutil de scroll (línea con goteo animado + flecha). Hero ahora ocupa pantalla completa. |
| **2 · Gancho visual (curaduría)** | Nueva sección con cuadrícula asimétrica de 3 fotos (1 grande + 2 apiladas): chamarra vintage, cerámica artesanal y rack de drops. Tags de categoría con los colores del sistema (verde pre-owned, ámbar artesanal, lila drops). Hover: zoom + quita el grayscale. **Fotos = placeholders de Unsplash — reemplazar por fotos reales de piezas.** |
| **3 · Comunidad (vender)** | Fondo gris muy oscuro (`#111118`) para romper el negro absoluto; título "Dale una segunda vida a tu clóset."; texto nuevo; CTA **outline morado** `[ EMPEZAR A VENDER ]` (borde `#6366f1`, fondo transparente) para no competir con el CTA principal. |
| **4 · Detalles** | Se eliminaron las líneas moradas divisorias full-width y la info-bar — las divisiones ahora son espacio negro. Footer minimalista al final con "RACK. POR BRUUK · PRE-OWNED + ARTESANAL · GDL, MX". Todo en contenedor de 1100 px para desktop. |

Verificado con capturas en 390×844 (móvil) y 1440×900 (desktop). Build y lint ✓.
Pendiente: la ruta `/rack/vender` no existe aún — el botón VENDER tiene un TODO.

---

## 1. Resumen

Se revisó el proyecto completo: el build pasa sin errores (`npm run build` ✓) y se corrigieron
**4 errores y 1 warning de ESLint** — ahora `npm run lint` está 100% limpio.
Las mejoras de UI del landing se aplicaron y luego **se revirtieron a petición**, quedando el
landing exactamente como estaba antes.

| Área | Estado |
|---|---|
| Build (`tsc -b && vite build`) | ✅ Sin errores |
| Lint (`eslint .`) | ✅ 0 errores, 0 warnings |
| Landing (App.tsx / App.css) | ↩️ Revertido a su estado original |
| Supabase | ⏳ Sin conectar — la app funciona con fallback |

---

## 2. Correcciones aplicadas (permanecen en el código)

### 2.1 `api/join.ts`
- **Problema:** variable `tags` desestructurada del body pero nunca usada.
- **Fix:** se eliminó del destructuring.

```diff
- const { email, tags } = request.body;
+ const { email } = request.body;
```

### 2.2 `src/components/RegistrationModal.tsx`
- **Problema:** `catch (error: any)` — uso de `any` explícito.
- **Fix:** se quitó la anotación; el catch usa el tipo implícito `unknown`.

```diff
- } catch (error: any) {
+ } catch (error) {
```

### 2.3 `src/contexts/AuthContext.tsx`
- **Problema:** warning de `react-refresh/only-export-components` por exportar el hook
  `useAuth` en el mismo archivo que el componente `AuthProvider`.
- **Fix:** disable intencional documentado (hook y provider conviven a propósito;
  separarlos obligaría a tocar imports en toda la app).

```ts
// eslint-disable-next-line react-refresh/only-export-components -- hook y provider conviven a propósito
export function useAuth() {
```

### 2.4 `src/rack/hooks/useRackApi.ts` — reestructura de `useFetch`
- **Problema:** `react-hooks/set-state-in-effect` — se llamaba `setLoading(false)` /
  `setData(...)` de forma **síncrona dentro del `useEffect`**, lo que provoca renders en cascada.
- **Fix:** el estado inicial (sin URL o con caché vigente) ahora se deriva **en render**
  con la función `stateFor()` y el patrón recomendado de React para "estado derivado de props":

```ts
const [state, setState] = useState<FetchState<T>>(() => stateFor<T>(url));
const [prevUrl, setPrevUrl] = useState(url);

if (url !== prevUrl) {          // si cambia la URL, se recalcula en render
  setPrevUrl(url);
  setState(stateFor<T>(url));
}
```

- El efecto solo hace el `fetch` real (asíncrono) y se eliminó el `abortRef` redundante —
  el cleanup del efecto ya aborta el request.
- El comportamiento es idéntico: caché de 60 s, abort al desmontar, manejo de errores.

### 2.5 `src/rack/RackExplore.tsx`
- **Problema:** warning `react-hooks/exhaustive-deps` — `allProducts` (`products ?? []`)
  se recreaba en cada render y era dependencia del `useMemo`.
- **Fix:** el fallback `?? []` se movió dentro del `useMemo` con `products` como dependencia,
  y el lookup del feed ahora usa `filteredProducts` (más correcto, ya que el feed se construye
  a partir de la lista filtrada).

---

## 3. Mejoras de UI del landing — APLICADAS Y REVERTIDAS ↩️

Estas mejoras se implementaron en `src/App.tsx` y `src/App.css` siguiendo el design system
(`docs/DESIGN_SYSTEM.md`) y luego **se revirtieron por completo a petición**.
Se documentan por si se quieren retomar (todas o por partes):

| # | Mejora | Detalle |
|---|---|---|
| 1 | **Badge del hero** | Pill "● Guadalajara, MX · Comunidad fundadora abierta" con dot pulsante — usaba estilos `.hero-badge` que **ya existen en `index.css` pero nunca se usan** |
| 2 | **Ticker marquee** | Banda rotada lila entre hero y "El Mar" con "MENOS PANTALLA ★ MÁS MUNDO ★ CERO ALGORITMOS…" — usaba `.ticker-wrap`/`.ticker` que **ya existen en `index.css` sin usarse** |
| 3 | **Watermark del hero** | "BRUUK" gigante en outline lila translúcido detrás del hero |
| 4 | **Segundo glow** | Bloque de luz skewed en el lado izquierdo del hero para profundidad |
| 5 | **Indicador de scroll** | Línea vertical con goteo animado en lila + label "SCROLL" (oculto en móvil) |
| 6 | **Numeración editorial** | Tags `/01 /02 /03` en las feature cards, rotan en hover |
| 7 | **Chips del Rack** | "PRE-OWNED · ARTESANÍAS · PIEZAS ÚNICAS · HECHO EN GDL" como burbujas del design system (fondo `--bubble-bg`, sombra sólida lila, rotación alternada) |
| 8 | **Badge "La App"** | Pill "● En construcción · Beta privada" sobre el título |
| 9 | **Limpieza** | Los estilos inline del header de features se movieron a clases CSS |

> **Nota:** los puntos 1 y 2 son los de menor riesgo si se quieren retomar — el CSS ya está
> escrito en `index.css`, solo falta el JSX.

---

## 4. Hallazgos de la revisión (sin cambios, para tu radar)

- **Supabase sin conectar — OK:** `src/lib/supabase.ts` crea un cliente placeholder y avisa
  por consola; `AuthContext` envuelve todo en try/catch. El landing, El Mar y el Rack funcionan
  sin credenciales; `/app` redirige a `/login` (esperado). Cuando conectes: correr
  `supabase-setup.sql` (incluye fix de RLS) y `supabase-app-setup.sql` + claves en `.env`
  (ver `.env.example`).
- **`PhotoCarousel`** (`src/components/PhotoCarousel.tsx`) está implementado pero **no se usa
  en ninguna página**, y las fotos `img/bruukcarrusel1-3.JPG` tampoco se referencian.
- **Bundle:** Vite avisa que `index.js` pesa ~500 kB minificado. No es urgente, pero se puede
  partir con `manualChunks` o lazy imports de rutas (`React.lazy`) cuando quieras.
- **Commit `286d865 "gg"`:** se hizo mientras las mejoras de UI estaban a medias, así que ese
  commit contiene parte del landing modificado. El revert quedó en el working tree
  (`M src/App.tsx`); al hacer el siguiente commit la historia queda consistente.

---

## 5. Archivos tocados (estado final)

| Archivo | Cambio |
|---|---|
| `api/join.ts` | Variable sin usar eliminada |
| `src/components/RegistrationModal.tsx` | `any` eliminado |
| `src/contexts/AuthContext.tsx` | Disable de lint documentado |
| `src/rack/hooks/useRackApi.ts` | `useFetch` reestructurado (sin setState síncrono en efecto) |
| `src/rack/RackExplore.tsx` | Dependencias de `useMemo` corregidas |
| `src/App.tsx` | Sin cambios netos (mejoras aplicadas y revertidas) |
| `src/App.css` | Sin cambios netos (mejoras aplicadas y revertidas) |
