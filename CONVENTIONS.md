# CONVENTIONS.md — Convenciones de código en Bruuk

Reglas concretas basadas en los patrones ya establecidos en el repo, no en preferencias genéricas de internet. Cuando un patrón legacy contradiga una regla de aquí, la regla de aquí gana para código **nuevo** — no se retrofitea código viejo salvo que se esté tocando esa sección de todas formas.

---

## 1. Dónde va cada tipo de código

| Tipo de código | Ubicación | Ejemplo real |
|---|---|---|
| Llamada a Supabase | `packages/shared-logic/src/services/*Service.ts` | `experienceService.ts` |
| Lógica de estado compartido entre pantallas | `packages/shared-logic/src/hooks/*.ts` o `stores/*.ts` | `useAuth.ts`, `sessionStore.ts` |
| Implementación de storage/geo/navegación específica de web | `apps/web/src/lib/adapters/*.ts` | `storageAdapter.ts` |
| Componente de UI reutilizable de un dominio | `apps/web/src/features/<dominio>/components/*.tsx` | `ExperienceCard.tsx` |
| Orquestador de ruta | `apps/web/src/pages/*.tsx` | `ExperienciasPage.tsx` (delgado) |
| Utilidad genérica sin estado (fechas, formateo) | `apps/web/src/lib/utils.ts` | — |

**Nunca:** una llamada a `supabase.from()`/`.auth.`/`.rpc()` dentro de un componente o página. Siempre pasa por un servicio.

## 2. Naming

- Componentes y páginas: `PascalCase.tsx` (`ExperienceCard.tsx`, `DashboardPage.tsx`)
- Hooks: `camelCase.ts` con prefijo `use` (`useExperiences.ts`, `useAttendees.ts`)
- Servicios: `camelCase` + sufijo `Service` (`experienceService.ts`, `userService.ts`)
- Stores Zustand: `camelCase` + sufijo `Store` (`sessionStore.ts`, `uiStore.ts`)
- Adapters: `camelCase` + sufijo `Adapter` (`storageAdapter.ts`, `geoAdapter.ts`)
- CSS Modules: mismo nombre que el componente + `.module.css` (`ExperienceCard.module.css`)

## 3. Estructura de un servicio nuevo (plantilla)

```typescript
// packages/shared-logic/src/services/exampleService.ts
import { supabase } from '../lib/supabaseClient';

export async function getExampleData(param: string) {
  const { data, error } = await supabase
    .from('example_table')
    .select('*')
    .eq('column', param);

  if (error) throw error;
  return data;
}

export async function createExample(payload: ExamplePayload) {
  const { data, error } = await supabase
    .from('example_table')
    .insert([payload]);

  if (error) throw error;
  return data;
}
```

Agrégalo al `index.ts` de `services/` para que quede exportado vía `@bruuk/shared-logic/services`.

## 4. Estructura de un hook nuevo (plantilla)

```typescript
// packages/shared-logic/src/hooks/useExample.ts
import { useState, useEffect } from 'react';
import { getExampleData } from '../services/exampleService';

export function useExample(param: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getExampleData(param)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [param]);

  return { data, loading, error };
}
```

**Sin imports de `react-dom`, `react-router-dom`, ni CSS.** Solo `react` (hooks base) y otros módulos de `shared-logic`.

## 5. Estructura de un componente nuevo (plantilla)

```tsx
// apps/web/src/features/<dominio>/components/ExampleCard.tsx
import styles from './ExampleCard.module.css';
import { useExample } from '@bruuk/shared-logic/hooks';

interface ExampleCardProps {
  id: string;
}

export function ExampleCard({ id }: ExampleCardProps) {
  const { data, loading, error } = useExample(id);

  if (loading) return <div className={styles.skeleton} />;
  if (error) return <div className={styles.error}>Error al cargar</div>;

  return (
    <div className={styles.card}>
      {/* contenido */}
    </div>
  );
}
```

Sin lógica de fetching ni validación inline — todo delegado al hook.

## 6. Manejo de errores (deuda técnica en transición)

**Estado actual (legacy, no replicar en código nuevo):**
```typescript
try {
  const { error } = await experienceService.createBooking({ ... });
  if (error && error.code !== '23505') throw error;
  alert('¡Reserva confirmada con éxito!');
} catch (err: any) {
  console.error(err);
  alert('Error al reservar: ' + err.message);
}
```

**Regla para código nuevo:** no usar `alert()`/`confirm()`. Hasta que se instale un sistema de toasts (deuda técnica pendiente, ver `ARCHITECTURE.md` sección 7), usar como mínimo un estado local de error mostrado en UI (`<div className={styles.error}>`), nunca un diálogo bloqueante del navegador.

## 7. Conventional Commits

Formato: `tipo(scope opcional): descripción breve en imperativo`

| Tipo | Uso |
|---|---|
| `feat:` | Funcionalidad nueva |
| `fix:` | Corrección de bug |
| `refactor:` | Cambio de estructura sin cambiar comportamiento |
| `style:` | Cambios puramente visuales/CSS |
| `perf:` | Mejora de rendimiento |
| `chore:` | Configuración, dependencias, tareas de mantenimiento |
| `docs:` | Cambios solo de documentación |

Ejemplos reales del proyecto:
- `refactor(monorepo): move services to packages/shared-logic`
- `feat(monorepo): add Zustand stores (session, ui, notifications placeholder)`
- `fix(fase1): resolve leftover TypeScript errors from Supabase decoupling`

Un commit = un cambio verificable con su propio checkpoint. No mezclar una corrección de deuda técnica con una feature nueva en el mismo commit.

## 8. CSS

- **Código nuevo:** siempre CSS Modules (`Componente.module.css`), importado como `import styles from './Componente.module.css'` y usado como `className={styles.algo}`.
- **Código legacy:** CSS global (`import './Componente.css'`) sigue presente en la mayoría del proyecto. No migrar retroactivamente salvo que ya se esté tocando ese componente por otra razón.

## 9. Límite de tamaño de archivo (guía, no regla dura)

Si un archivo de página supera ~200 líneas, es señal de extraer componentes o mover lógica a un hook. `ExperienciasPage.tsx` llegó a 750+ líneas antes de la migración — ese es el ejemplo de referencia de lo que se busca evitar.
