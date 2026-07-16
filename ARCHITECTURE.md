# ARCHITECTURE.md — Arquitectura de Bruuk

Estado real del repositorio en la rama `migration/monorepo`, julio 2026. Este documento se actualiza en cada cambio estructural — no dejarlo desactualizado.

---

## 1. Arquitectura de capas (implementada)

```
┌─────────────────────────────────────────────────────────┐
│  apps/web (@bruuk/web)                                    │
│  React 19 + React DOM + Vite + React Router DOM 7          │
│  CSS Modules (componentes nuevos) + CSS global (legacy)      │
│  Capacitor configurado (prep only, sin build nativo activo)   │
└──────────────────────┬──────────────────────────────────────┘
                        │ importa
┌──────────────────────▼──────────────────────────────────────┐
│  packages/shared-logic (@bruuk/shared-logic)                  │
│  100% agnóstico de plataforma — sin react-dom, sin CSS          │
│                                                                  │
│  hooks/     useAuth, useExperiences, useGeolocation,             │
│             useBooking, useAttendees                              │
│  services/  authService, experienceService, userService,           │
│             dashboardService, oceanService                          │
│  stores/    sessionStore, uiStore, notificationsStore (Zustand)      │
│  adapters/  storageAdapter, geoAdapter, navigationAdapter (contratos) │
│  lib/       supabaseClient.ts                                          │
└──────────────────────┬──────────────────────────────────────────────┘
                        │ usa
┌──────────────────────▼──────────────────────────────────────────────┐
│  Supabase (Postgres + Auth + Storage, RLS activo)                      │
│  Vercel Serverless Functions (apps/web/api/)                            │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Patrón Adapter — contrato vs. implementación

Los 3 adapters siguen el mismo patrón, listo para que una futura `apps/mobile` (Expo) implemente su propia versión sin tocar el contrato:

| Adapter | Contrato (shared-logic) | Implementación web (apps/web) | Implementación futura (apps/mobile) |
|---|---|---|---|
| Storage | `IStorageAdapter` | `localStorage` | `@capacitor/preferences` o `AsyncStorage` |
| Geolocalización | `IGeolocationAdapter` | `navigator.geolocation` | `expo-location` |
| Navegación | `INavigationAdapter` + `useNavigation()` | React Router `useNavigate()` | React Navigation |

**Regla:** ningún nuevo adapter se implementa directo en `shared-logic` — siempre contrato ahí, implementación en la app consumidora.

## 3. Flujo de datos típico

```
Componente (apps/web/src/features/.../components/X.tsx)
       │
       ▼
Hook (packages/shared-logic/src/hooks/useX.ts)
       │
       ▼
Servicio (packages/shared-logic/src/services/xService.ts)
       │
       ▼
supabaseClient.ts (packages/shared-logic/src/lib/)
       │
       ▼
Supabase (Postgres + Auth + Storage, RLS)
```

Verificado sin excepciones por grep (`MIGRATION_AUDIT_FINAL.md` sección 6): cero llamadas directas a Supabase fuera de `services/`, cero imports de `react-dom`/`react-router-dom`/`.css` dentro de `shared-logic`.

## 4. Componentes atómicos de Experiencias (extraídos de `ExperienciasPage.tsx`)

| Componente | CSS Module | Responsabilidad |
|---|---|---|
| `ExperienceCard.tsx` | `ExperienceCard.module.css` | Tarjeta individual en listado |
| `ExperienceDetailModal.tsx` | `ExperienceDetailModal.module.css` | Vista detallada + reserva + asistentes (usa `useAttendees`) |
| `ExperienceMap.tsx` | `ExperienceMap.module.css` | Mapa Leaflet aislado |
| `CategorySelector.tsx` | `CategorySelector.module.css` | Filtro de categorías |

`ExperienciasPage.tsx` quedó como orquestador delgado que consume `useExperiences` y renderiza estos 4 componentes.

## 5. Modelo de datos

```
auth.users (Supabase Auth)
     │
     ▼
profiles (1:1, autocompletado por trigger handle_new_user)
     │
     ├──> spot_saves ──> spots
     ├──> spot_reviews ──> spots
     │
     └──> experiences (host_id)
              │
              ▼
           events (fecha, cupo)
              │
              ▼
           bookings (usuario ←→ evento, referrer_id)
                │
                └──> consultado por useAttendees para mostrar asistentes confirmados

invite_codes (independiente, RPC verify_and_use_invite_code)
share_clicks (independiente, telemetría de referidos)
```

## 6. Rutas de la aplicación

**Públicas:**
- `/` → `App` (landing)
- `/nosotros` → `NosotrosPage`
- `/login` → `LoginPage`
- `/descubrir`, `/descubrir/:city` → `OceanLanding`
- `/experiencias`, `/experiencias/:city` → `ExperienciasPage`
- `/profile/:username` → `ProfilePage` (vista pública)

**Protegidas:**
- `/setup` → `ProfileSetupPage`
- `/app` → `DashboardPage`
- `/chats` → `ChatsPage`
- `/perfil` → `ProfilePage` (propio)
- `/verify` → `VerifyInvitePage`

Navegación entre estas rutas usa React Router directo en la mayoría del código legacy; el `useNavigation()` agnóstico está disponible y debe usarse en todo componente nuevo dentro de `shared-logic` o que se planee reutilizar en `apps/mobile` a futuro.

## 7. Deuda técnica restante (priorizada)

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 1 | Cero tests de componentes en `apps/web` (solo `shared-logic` tiene tests) | Alto | 🔴 |
| 2 | `alert()`/`confirm()` nativos en flujos de reserva/error | Medio | 🟡 |
| 3 | CSS global aún predomina fuera de los 4 componentes migrados | Medio | 🟡 |
| 4 | Estrategia de promoción `migration/monorepo` → `main` sin definir | Medio (organizativo) | 🟡 |
| 5 | 7 commits pre-migración sin Conventional Commits | Bajo (histórico, no se corrige) | 🟢 |

## 8. Extensiones futuras previstas

- **`apps/mobile/`** (Expo/React Navigation) — consumirá `@bruuk/shared-logic` sin modificarlo; requiere implementar adapters web-equivalentes para RN.
- **Mensajería:** nuevo dominio `messaging` en `shared-logic` (`messagingService.ts` sobre Supabase Realtime, `useConversation` hook, `notificationsStore` ya tiene el placeholder listo).
- **Gestión de imágenes:** `mediaService.ts` con compresión en cliente antes de subir a Supabase Storage.
- **Agendado:** extensión de `useBooking` con lógica de disponibilidad/calendario sobre el modelo `experiences → events → bookings` ya existente.
