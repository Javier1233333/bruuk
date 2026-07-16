# CLAUDE.md — Contexto para agentes IA en Bruuk

Este archivo es el punto de entrada obligatorio para cualquier agente (Claude, Antigravity, Gemini CLI, GitHub Copilot) que trabaje en este repositorio. Léelo completo antes de escribir o modificar código. Si algo aquí contradice lo que ves en el código, el código real gana — pero repórtalo, no lo ignores en silencio.

> Última actualización: julio 2026, tras completar la migración a monorepo en la rama `migration/monorepo`.

---

## 1. Qué es Bruuk

Plataforma de experiencias curadas (turismo/actividades locales) en México. Usuarios exploran experiencias por ciudad, se registran, reservan cupos, guardan spots favoritos, y (a futuro) se mensajean entre sí. Equipo: 2 personas (Luis + Javier).

## 2. Estrategia de ramas — IMPORTANTE

- **`main`** = producción. **No se mergea a esta rama sin decisión explícita.**
- **`migration/monorepo`** = rama de trabajo activo actual. Todo desarrollo nuevo (mensajería, agendado, features futuras) continúa aquí hasta que se decida una estrategia formal de promoción a producción.
- Antes de abrir una rama nueva para cualquier feature, confirma en qué rama estás parado (`git branch`) — ya hubo confusión una vez entre `migration/monorepo` y `refactor/architecture-migration` (esta última fue eliminada).

## 3. Arquitectura: Monorepo (completado)

```
bruuk/
├── packages/
│   └── shared-logic/        (@bruuk/shared-logic) — lógica 100% agnóstica de plataforma
│       ├── adapters/         (storage, geo, navigation — contratos + setters)
│       ├── hooks/             (useAuth, useExperiences, useGeolocation, useBooking, useAttendees)
│       ├── services/          (auth, experience, user, dashboard, ocean)
│       ├── stores/             (Zustand: session, ui, notifications)
│       └── lib/                (supabaseClient.ts)
└── apps/
    └── web/                   (@bruuk/web) — React DOM + Vite + Capacitor (prep)
        ├── src/lib/adapters/   (implementaciones web de los 3 contratos agnósticos)
        ├── src/features/experiences/components/  (componentes atómicos + CSS Modules)
        ├── src/pages/           (orquestadores delgados)
        └── src/contexts/AuthContext.tsx  (wrapper delgado sobre sessionStore, no duplica lógica)
```

**Regla de oro:** cualquier lógica de negocio nueva (fetch de datos, validaciones, estado compartido entre pantallas) va en `packages/shared-logic`. Cualquier cosa específica de React DOM (JSX, CSS, eventos de navegador) va en `apps/web`. Si en algún momento agregamos `apps/mobile` (Expo), esa app también consumirá `@bruuk/shared-logic` sin tocar `apps/web`.

## 4. Comandos reales

```bash
pnpm install         # Instala todo el workspace (raíz, apps/web, packages/shared-logic)
pnpm dev:web         # Levanta apps/web en modo desarrollo
pnpm build:web       # Compila apps/web (tsc -b && vite build)
pnpm -r test         # Corre tests en todos los workspaces (actualmente solo shared-logic tiene tests)
```

## 5. Reglas no negociables

1. **Ninguna llamada a `supabase.from()`, `supabase.auth.`, o `supabase.rpc()` fuera de `packages/shared-logic/src/services/`.** Verificado con grep en cada PR — ver `TESTING.md`.
2. **`packages/shared-logic` no importa `react-dom`, `react-router-dom`, ni archivos `.css`.** Es agnóstico por diseño — cualquier violación rompe la posibilidad de reutilizarlo en una futura app Expo.
3. **Todo adapter nuevo (storage, geo, navigation, y los que vengan: media, notifications push) sigue el patrón contrato + implementación:** interfaz en `shared-logic/adapters/`, implementación específica en `apps/web/src/lib/adapters/` (y más adelante en `apps/mobile/src/lib/adapters/`).
4. **Todo componente nuevo en `apps/web` usa CSS Modules** (`Componente.module.css`), siguiendo el patrón ya establecido en `ExperienceCard`, `ExperienceDetailModal`, `ExperienceMap`, `CategorySelector`.
5. **No usar `alert()`/`confirm()` nativos para feedback al usuario** — pendiente de reemplazo por sistema de toasts (deuda técnica heredada, ver sección 7).
6. **Conventional Commits siempre**, con scope cuando aplique (`feat(monorepo):`, `fix(fase1):`, `refactor(experiences):`). El historial de la migración es 100% conforme — mantener ese estándar.
7. **Antes de agregar un hook o servicio nuevo, revisa si ya existe algo similar** en `shared-logic/hooks/` o `services/` — evita duplicar lo que ya está centralizado.
8. **Cualquier hook o servicio agregado que no estuviera en el plan original debe documentarse** (razón de por qué se agregó) en el PR/commit correspondiente — así pasó con `useAttendees.ts`, agregado correctamente para cubrir la necesidad de `ExperienceDetailModal` de mostrar asistentes confirmados.

## 6. Esquema de base de datos (resumen)

- `invite_codes` — control de registro por invitación, con RPC `verify_and_use_invite_code`
- `profiles` — perfil extendido, autocompletado por trigger `handle_new_user`
- `spots` / `spot_saves` / `spot_reviews` — lugares curados y reseñas
- `experiences` → `events` → `bookings` — modelo de 3 niveles
- `share_clicks` — telemetría de referidos

RLS activo en todas las tablas. No desactivar políticas para "probar algo rápido".

## 7. Deuda técnica pendiente (post-migración)

1. **Testing incompleto:** hay 5 archivos de test en `shared-logic` (sessionStore, useAuth, useBooking, useExperiences, useGeolocation), pero `apps/web` no tiene ningún test de componentes todavía. Ver `TESTING.md` para el plan de cobertura.
2. **`alert()`/`confirm()` nativos** siguen presentes en varios flujos (reservas, errores). Reemplazar por sistema de toasts.
3. **7 commits del historial pre-migración no siguen Conventional Commits** (ej. `"tryin"`, `"app"`). No se corrigen retroactivamente (reescribir historia es más riesgoso que el beneficio), pero sirve como recordatorio de por qué la regla 6 importa hacia adelante.
4. **Capacitor está en modo "prep only"** — configurado pero sin build nativo real ejecutado. No se activa hasta que haya decisión explícita de publicar en stores.
5. **Estrategia de ramas sin resolver** (ver sección 2) — `migration/monorepo` funcionando como rama de desarrollo de facto sin fecha definida de promoción a `main`.

## 8. Documentos relacionados

- `ARCHITECTURE.md` — diagrama detallado, modelo de datos, rutas
- `CONVENTIONS.md` — estilo de código, naming, plantillas de archivo
- `TESTING.md` — estado y plan de cobertura de tests
- `docs/adr/` — decisiones de arquitectura y su razonamiento
- `plans/Plan_Migracion_Monorepo_Bruuk.md` — plan original de migración (completado)
- `MIGRATION_AUDIT_FINAL.md` — auditoría de cierre de la migración (julio 2026)
