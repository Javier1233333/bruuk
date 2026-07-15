# Plan de Migración a Monorepo — Bruuk

**Versión:** 3.0
**Fecha:** Julio 2026
**Contexto:** La Fase 1 del plan original (servicios desacoplados de Supabase) ya fue implementada dentro de la estructura actual (`src/features/*/services/`, `src/shared/adapters/storageAdapter.ts`). Este plan **no descarta ese trabajo** — lo reubica dentro de una estructura de monorepo (`packages/shared-logic` + `apps/web`) para que en el futuro (12+ meses) se pueda agregar `apps/mobile` con Expo sin duplicar lógica ni reescribir servicios.

**Regla de oro para Antigravity:** este plan es una **migración de ubicación y de contratos**, no una reescritura funcional. La lógica de negocio ya implementada (queries de Supabase, validaciones, flujos de auth) debe preservarse tal cual — solo cambia dónde vive el archivo y cómo se separan las partes agnósticas de las específicas de plataforma.

---

## 0. Objetivo de esta fase

Convertir el proyecto de una sola app (`src/`) a un monorepo con dos workspaces:

```
bruuk/
├── packages/
│   └── shared-logic/       ← lógica 100% agnóstica de plataforma
└── apps/
    └── web/                 ← lo que hoy es tu app (React DOM + Vite + Capacitor futuro)
```

`apps/mobile/` (Expo) **no se crea en este plan** — se agregará más adelante consumiendo `packages/shared-logic` sin tocarlo.

---

## 1. Setup de monorepo (antes de mover código)

1. Instalar pnpm si no está disponible (`npm install -g pnpm`).
2. En la raíz del repo, crear `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'packages/*'
     - 'apps/*'
   ```
3. Crear estructura de carpetas vacía:
   ```
   mkdir -p packages/shared-logic/src
   mkdir -p apps/web
   ```
4. Mover **todo el contenido actual del proyecto** (excepto `node_modules`, `.git`, archivos de config raíz) a `apps/web/`. Esto incluye `src/`, `public/`, `vite.config.ts`, `tsconfig.json`, `index.html`, `api/` (Vercel functions), `middleware.ts`, `supabase/`.
5. Reescribir el `package.json` raíz para que sea solo orquestador:
   ```json
   {
     "name": "bruuk-monorepo",
     "private": true,
     "version": "0.1.0",
     "scripts": {
       "dev:web": "pnpm --filter @bruuk/web run dev",
       "build:web": "pnpm --filter @bruuk/web run build",
       "test": "pnpm -r run test"
     }
   }
   ```
6. Crear `apps/web/package.json` con `"name": "@bruuk/web"` y agregar como dependencia:
   ```json
   "dependencies": {
     "@bruuk/shared-logic": "workspace:*"
   }
   ```
7. Crear `packages/shared-logic/package.json`:
   ```json
   {
     "name": "@bruuk/shared-logic",
     "version": "0.1.0",
     "type": "module",
     "main": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts",
       "./adapters": "./src/adapters/index.ts",
       "./hooks": "./src/hooks/index.ts",
       "./services": "./src/services/index.ts",
       "./stores": "./src/stores/index.ts"
     },
     "dependencies": {
       "@supabase/supabase-js": "^2.38.0",
       "zustand": "^4.4.0"
     }
   }
   ```
8. Verificar que `pnpm install` corre sin errores en la raíz antes de mover ningún archivo de lógica.

**Checkpoint:** el proyecto debe seguir corriendo (`pnpm dev:web`) exactamente igual que antes, ya que hasta este punto solo se movió de carpeta sin tocar imports internos.

---

## 2. Migrar el `storageAdapter` (partir en contrato + implementación)

Este es el ajuste más importante porque ya existe una versión web-only.

1. En `packages/shared-logic/src/adapters/storageAdapter.ts`, crear **solo el contrato**:
   ```ts
   export interface IStorageAdapter {
     get(key: string): Promise<string | null>;
     set(key: string, value: string): Promise<void>;
     remove(key: string): Promise<void>;
   }

   export let storageAdapter: IStorageAdapter;

   export function setStorageAdapter(adapter: IStorageAdapter) {
     storageAdapter = adapter;
   }
   ```
2. Mover la implementación actual (la que ya escribiste usando `localStorage`) a `apps/web/src/lib/adapters/storageAdapter.ts`, ajustada para implementar `IStorageAdapter` e importar `setStorageAdapter` desde `@bruuk/shared-logic/adapters`.
3. Llamar `setStorageAdapter(webStorageAdapter)` en el punto de entrada de la app web (`apps/web/src/main.tsx`), **antes** de que se inicialice el cliente de Supabase.

**Checkpoint:** login/logout y persistencia de sesión deben comportarse exactamente igual que antes de la migración. Probar recarga de página y verificar que la sesión sobrevive.

---

## 3. Migrar servicios existentes a `packages/shared-logic`

Los siguientes archivos, ya creados en Fase 1, se mueven **tal cual** (con ajuste de imports) a `packages/shared-logic/src/services/`:

- `authService.ts`
- `experienceService.ts`
- `userService.ts`
- `dashboardService.ts`
- `oceanService.ts`

Pasos:
1. Mover cada archivo a `packages/shared-logic/src/services/`.
2. Reemplazar cualquier import directo de `localStorage` o APIs de navegador dentro de estos servicios por el `storageAdapter` agnóstico (si alguno lo usa directamente en vez de vía Supabase Auth).
3. Mover la inicialización del cliente de Supabase (`src/lib/supabase.ts`) a `packages/shared-logic/src/lib/supabaseClient.ts`, recibiendo el `storageAdapter` ya inyectado desde `apps/web`.
4. En `apps/web/`, reemplazar todos los imports de estos servicios para que apunten a `@bruuk/shared-logic/services` en vez de la ruta local anterior.

**Checkpoint:** correr `pnpm build:web` — cero errores de TypeScript. Correr el grep de verificación:
```bash
grep -rn "supabase.from(\|supabase.auth\." apps/web/src --include=*.tsx
```
Debe seguir devolviendo cero resultados (ya lo validaste en Fase 1; confirmar que sigue así tras el movimiento).

---

## 4. Fase 2.5 — Zustand stores en shared-logic

(No implementada aún según tu reporte — se hace ahora, ya en ubicación correcta desde el inicio.)

1. Instalar zustand en `packages/shared-logic`.
2. Crear `packages/shared-logic/src/stores/sessionStore.ts`, `uiStore.ts`, `notificationsStore.ts` (placeholder), agnósticos por diseño — no importan nada de React DOM ni React Native.
3. Migrar progresivamente el estado de `AuthContext.tsx` (que vive en `apps/web`) hacia `sessionStore`, dejando el Context como wrapper delgado si algún componente todavía lo consume directamente.

---

## 5. Fase 2 — Hooks en shared-logic

1. Crear en `packages/shared-logic/src/hooks/`:
   - `useExperiences.ts`
   - `useGeolocation.ts` (usará un `geoAdapter` agnóstico — crear su contrato igual que `storageAdapter`)
   - `useBooking.ts`
   - `useAuth.ts` / `useSession.ts` (consumiendo `sessionStore` + `authService`)
2. Estos hooks consumen los servicios ya migrados en el paso 3. No deben importar nada de `react-dom`, `react-router-dom`, ni componentes de UI — solo `react` (hooks base) y lo que esté en `shared-logic`.
3. Pruebas unitarias de estos hooks dentro de `packages/shared-logic/tests/`, sin necesidad de levantar `apps/web`.

**Checkpoint:** `packages/shared-logic` debe poder buildear/testear de forma aislada, sin depender de `apps/web`.

---

## 6. Navigation Adapter (agnóstico, preparación para Expo)

1. Crear `packages/shared-logic/src/adapters/navigationAdapter.ts` con el contrato:
   ```ts
   export interface NavigationTarget {
     screen: 'home' | 'experiences' | 'experience-detail' | 'profile' | 'chat' | 'bookings' | 'create-experience' | 'login';
     params?: Record<string, any>;
   }

   export interface INavigationAdapter {
     navigate(target: NavigationTarget): void;
     goBack(): void;
     replace(target: NavigationTarget): void;
   }

   export let navigationAdapter: INavigationAdapter;
   export function setNavigationAdapter(adapter: INavigationAdapter) {
     navigationAdapter = adapter;
   }

   export function useNavigation() {
     return {
       navigate: (screen: string, params?: Record<string, any>) =>
         navigationAdapter.navigate({ screen: screen as any, params }),
       goBack: () => navigationAdapter.goBack(),
       replace: (screen: string, params?: Record<string, any>) =>
         navigationAdapter.replace({ screen: screen as any, params })
     };
   }
   ```
2. Crear `apps/web/src/lib/adapters/navigationAdapter.ts`: implementación con React Router (`useNavigate`), mapeando `screen` agnóstico a rutas reales (`/app/experiencias/:id`, etc.).
3. Envolver `App.tsx` con un `NavigationAdapterProvider` que registre el adapter web al montar, antes de que cualquier componente hijo intente navegar.
4. Reemplazar gradualmente los usos directos de `useNavigate()` de React Router dentro de componentes de features (no en `App.tsx`/páginas raíz) por el `useNavigation()` agnóstico, empezando por los componentes que eventualmente vivirán compartidos.

**Nota:** esto no es urgente si Fase 3 (despiece de UI) todavía no está lista — puede hacerse en paralelo o inmediatamente después. Lo importante es que el contrato exista antes de escribir más componentes nuevos, para no tener que refactorizar navegación dos veces.

---

## 7. Fase 3 — Despiece de UI + CSS Modules (sin cambios de fondo, solo ubicación)

Se ejecuta igual que en el plan original, pero los componentes atómicos se crean en `apps/web/src/features/experiences/components/` (no en `shared-logic`, porque usan React DOM/JSX específico de web):

1. `ExperienceCard.tsx`, `ExperienceDetailModal.tsx`, `ExperienceMap.tsx`, `CategorySelector.tsx` — cada uno con su `.module.css`.
2. Consumen hooks desde `@bruuk/shared-logic/hooks` y navegación desde `@bruuk/shared-logic/adapters` (`useNavigation`).
3. Reducir `ExperienciasPage.tsx`, `ProfilePage.tsx`, `DashboardPage.tsx`, `OceanLanding.tsx` a orquestadores delgados.

---

## 8. Fase 4 — Capacitor (sin cambios respecto al plan original)

Se configura dentro de `apps/web/`, ya que Capacitor empaqueta la app web tal cual. No requiere tocar `packages/shared-logic`.

---

## 9. Lo que NO se hace en este plan (para no confundir a Antigravity)

- No se crea `apps/mobile/`.
- No se instala `react-native` ni `react-native-web`.
- No se instala Expo ni React Navigation todavía.
- No se reescriben componentes a `<View>`/`<Text>` — siguen siendo JSX/HTML normal en `apps/web`.

Esto se hace **cuando llegue el momento de Expo**, y en ese punto `packages/shared-logic` ya estará listo para ser consumido por `apps/mobile` sin cambios.

---

## 10. Checklist de verificación final de esta migración

1. `pnpm install` en la raíz funciona sin errores.
2. `pnpm dev:web` levanta la app exactamente igual que antes de la migración.
3. `pnpm build:web` compila sin errores de TypeScript.
4. Login, logout, listado de experiencias, geolocalización y reservas funcionan igual que antes (regresión funcional cero).
5. `packages/shared-logic` no importa nada de `react-dom`, `react-router-dom`, ni CSS.
6. `apps/web` no contiene lógica de negocio duplicada — todo pasa por `@bruuk/shared-logic`.
7. El grep de verificación de Supabase (paso 3) sigue devolviendo cero resultados.

---

## 11. Orden de ejecución recomendado para Antigravity

1. Setup de monorepo (sección 1) — checkpoint: app corre igual que antes.
2. Migrar `storageAdapter` (sección 2) — checkpoint: sesión persiste igual.
3. Migrar servicios existentes (sección 3) — checkpoint: build limpio + grep en cero.
4. Fase 2.5: Zustand stores (sección 4).
5. Fase 2: Hooks (sección 5) — checkpoint: shared-logic testeable de forma aislada.
6. Navigation Adapter (sección 6) — antes de escribir componentes nuevos.
7. Fase 3: despiece de UI + CSS Modules (sección 7), componente por componente.
8. Fase 4: Capacitor (sección 8), solo al final.

No avanzar de sección sin pasar el checkpoint de la anterior.
