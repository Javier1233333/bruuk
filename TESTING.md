# TESTING.md — Estrategia de testing en Bruuk

Nivel de cobertura acordado: **medio** — se testean componentes atómicos y páginas orquestadoras principales. No se exige test para cada componente trivial (badges, iconos, wrappers de layout sin lógica), pero sí para todo lo que tenga estado, fetching, o lógica de interacción.

---

## 1. Estado actual

| Workspace | Framework | Cobertura |
|---|---|---|
| `packages/shared-logic` | Vitest + @testing-library/react + jsdom | 5 archivos: `sessionStore`, `useAuth`, `useBooking`, `useExperiences`, `useGeolocation` |
| `apps/web` | Ninguno instalado todavía | 0% |

## 2. Qué se testea (regla de nivel medio)

**Siempre requiere test:**
- Todo hook en `packages/shared-logic/src/hooks/` (ya establecido).
- Todo servicio en `packages/shared-logic/src/services/` (pendiente de completar — ver sección 5).
- Todo store en `packages/shared-logic/src/stores/` (`sessionStore` ya cubierto; `uiStore` y `notificationsStore` pendientes).
- Componentes atómicos de features con lógica propia: `ExperienceCard`, `ExperienceDetailModal`, `ExperienceMap`, `CategorySelector`, y cualquier componente nuevo equivalente que se agregue a `features/*/components/`.
- Páginas orquestadoras: `ExperienciasPage`, `DashboardPage`, `ProfilePage`, `OceanLanding`, y cualquier página nueva.

**No requiere test obligatorio (pero se acepta si se quiere):**
- Componentes puramente presentacionales sin estado ni props complejas (badges, separadores, iconos wrapper).
- Archivos de configuración, constantes, tipos.
- `AppShell` y layouts que solo posicionan hijos sin lógica propia.

## 3. Setup pendiente en `apps/web`

Antes de escribir el primer test de componente, instalar en `apps/web`:

```bash
pnpm --filter @bruuk/web add -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

Agregar a `apps/web/vite.config.ts` (o crear `vitest.config.ts` separado, siguiendo el mismo patrón que `packages/shared-logic/vitest.config.ts`):

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    globals: true,
  },
});
```

Agregar script en `apps/web/package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## 4. Plantilla de test para componente atómico

```tsx
// apps/web/src/features/experiences/components/ExperienceCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExperienceCard } from './ExperienceCard';

vi.mock('@bruuk/shared-logic/hooks', () => ({
  useExperiences: () => ({
    experiences: [{ id: '1', name: 'Catación de Café', city: 'Guadalajara' }],
    loading: false,
    error: null,
  }),
}));

describe('ExperienceCard', () => {
  it('renderiza el nombre de la experiencia', () => {
    render(<ExperienceCard id="1" />);
    expect(screen.getByText('Catación de Café')).toBeInTheDocument();
  });

  it('muestra estado de carga cuando loading es true', () => {
    // mock loading: true y verificar skeleton
  });

  it('muestra estado de error cuando falla el fetch', () => {
    // mock error y verificar mensaje
  });
});
```

**Regla:** mockear siempre los hooks de `@bruuk/shared-logic/hooks` en tests de componentes — no testear la lógica de negocio ahí (esa ya se testea en `shared-logic`), solo testear que el componente renderiza correctamente según el estado que el hook le da.

## 5. Plantilla de test para página orquestadora

```tsx
// apps/web/src/pages/ExperienciasPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExperienciasPage } from './ExperienciasPage';

vi.mock('@bruuk/shared-logic/hooks', () => ({
  useExperiences: () => ({ experiences: [], loading: false, error: null }),
}));

describe('ExperienciasPage', () => {
  it('renderiza sin errores con lista vacía', () => {
    render(<MemoryRouter><ExperienciasPage /></MemoryRouter>);
    expect(screen.getByRole('main')).toBeInTheDocument(); // ajustar selector real
  });

  it('renderiza los componentes atómicos hijos correctamente', () => {
    // verificar que CategorySelector, y las cards, están presentes
  });
});
```

## 6. Servicios pendientes de test en `shared-logic`

De los 5 servicios existentes, solo la lógica que consumen los hooks ya testeados tiene cobertura indirecta. Pendiente agregar tests directos para:

- `authService.ts`
- `experienceService.ts` (parcialmente cubierto vía `useExperiences`/`useBooking`)
- `userService.ts`
- `dashboardService.ts`
- `oceanService.ts`

Plantilla:
```typescript
// packages/shared-logic/tests/experienceService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getApprovedExperiences } from '../src/services/experienceService';

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
    })),
  },
}));

describe('experienceService.getApprovedExperiences', () => {
  it('retorna datos cuando la query es exitosa', async () => {
    const result = await getApprovedExperiences();
    expect(result).toBeDefined();
  });

  it('lanza error cuando Supabase retorna error', async () => {
    // mock error y verificar que se propaga
  });
});
```

## 7. Comando para correr todo

```bash
pnpm -r test    # Corre tests en shared-logic Y apps/web (una vez configurado el segundo)
```

## 8. Checkpoint para agentes IA

Ningún commit que agregue o modifique un componente atómico, página orquestadora, hook, servicio o store se considera completo sin su test correspondiente (o sin justificar explícitamente por qué cae en la categoría "no requiere test obligatorio" de la sección 2). Esto aplica desde ahora hacia adelante — no se exige retrofit inmediato de todo lo ya migrado, pero sí de todo lo nuevo.

## 9. Prioridad de implementación (orden sugerido)

1. Setup de Vitest en `apps/web` (sección 3).
2. Tests de los 4 componentes atómicos ya existentes (`ExperienceCard`, `ExperienceDetailModal`, `ExperienceMap`, `CategorySelector`).
3. Test de `ExperienciasPage` como página orquestadora de referencia.
4. Tests de servicios pendientes en `shared-logic` (sección 6).
5. Tests de `uiStore` y `notificationsStore`.
6. Extender la regla a `DashboardPage`, `ProfilePage`, `OceanLanding`.
