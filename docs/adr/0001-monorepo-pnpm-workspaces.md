# ADR 0001 — Monorepo con pnpm workspaces (packages/shared-logic + apps/web)

**Estado:** Aceptado e implementado (julio 2026, rama `migration/monorepo`)

## Contexto

Bruuk es una app web (React + Vite + Supabase) con planes de expandirse a apps nativas iOS/Android en el futuro (12+ meses), usando probablemente Expo/React Native, posiblemente en paralelo con Capacitor para la versión web empaquetada. El equipo es de 2 personas.

Antes de esta decisión, toda la lógica de negocio (servicios de Supabase, hooks, estado) vivía mezclada con componentes de UI dentro de `src/`, sin separación entre lo agnóstico de plataforma y lo específico de React DOM.

## Decisión

Se adoptó una estructura de monorepo con `pnpm workspaces`:
- `packages/shared-logic`: toda la lógica de negocio agnóstica (hooks, servicios, stores, contratos de adapters).
- `apps/web`: la app React DOM actual, consumiendo `shared-logic` como dependencia de workspace.

Se descartaron explícitamente estas alternativas:
- **Microservicios de backend:** evaluado y descartado — el problema real no era de backend sino de acoplamiento frontend/lógica; microservicios habría agregado complejidad operativa (deploys, orquestación) sin resolver el problema real. Ver razonamiento completo en la conversación de julio 2026 (no formalizado en ADR separado por ahora).
- **react-native-web (compartir componentes de UI, no solo lógica):** descartado por ahora — limitaciones de compatibilidad con librerías web ya en uso (Leaflet, Framer Motion) y menor madurez que compartir solo la capa de lógica.
- **Esperar a tener la app móvil para migrar:** descartado — el costo de extraer lógica de negocio ya escrita y mezclada con UI crece con cada feature nueva agregada sin esta separación. Precedente: Airbnb falló en su adopción de React Native por integrar código nuevo con legado de forma incremental (brownfield); Coinbase tuvo éxito hacienda una consolidación limpia. Para un equipo pequeño, el equivalente correcto es prevenir la mezcla desde el principio, no consolidar después de que ya existe.

## Consecuencias

**Positivas:**
- Cuando se agregue `apps/mobile` (Expo), reutiliza toda la lógica de `shared-logic` sin reescritura.
- Hooks y servicios son testeables de forma aislada, sin levantar la app completa.
- Fuerza disciplina de separación (verificado por grep en CI/checkpoints: cero imports de `react-dom`/`react-router-dom`/`.css` en `shared-logic`).

**Negativas / costos aceptados:**
- Mayor complejidad de setup inicial (workspace config, exports de package.json) que un proyecto de un solo paquete.
- Requiere disciplina activa del equipo (y de agentes IA) para no romper el aislamiento — mitigado con las reglas en `CLAUDE.md` y `CONVENTIONS.md`.
- La migración generó una ventana de riesgo (deuda de testing incompleta durante el movimiento de archivos) — mitigado parcialmente agregando tests a `shared-logic` como parte del mismo proceso, aunque `apps/web` quedó sin cobertura de componentes (deuda pendiente, ver `ARCHITECTURE.md`).

## Notas de implementación

Ejecutado siguiendo `plans/Plan_Migracion_Monorepo_Bruuk.md`, con verificación en cada fase (`MIGRATION_AUDIT_FINAL.md`). El patrón de adapters (contrato agnóstico + implementación por plataforma) se estableció para `storage`, `geo`, y `navigation`, replicable para futuros adapters (`media`, `push notifications`).
