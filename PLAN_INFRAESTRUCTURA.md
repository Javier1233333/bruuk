 Plan de Infraestructura — BRUUK

> Prioridad: ciberseguridad desde el diseño.
> Stack: Supabase + Vercel + React (Vite)

---
hhh
## 1. Estado actuald

### Lo que ya existe

| Capa               | Tecnología          | Estado                                   |
|---------------------|--------------------|-----------------------------------------|
| Hosting             | Vercel             | Activo — SPA + Serverless Functions     |
| Auth                | Supabase Auth      | Email/password + Google OAuth            |
| Base de datos       | Supabase (Postgres)| Solo tabla `invite_codes`                |
| Newsletter          | Beehiiv API        | Activo vía `/api/join`                   |
| Email transaccional | Resend             | Activo vía `/api/welcome`                |
| Registro a Sheets   | Google Apps Script | Activo vía `/api/sheets`                 |
| Acceso gateado      | Middleware Vercel   | Cookie `bruuk_access` en `/app`          |
| Firebase            | Firebase SDK       | Importado pero **sin uso**               |
| ProtectedRoute      | React component    | **Deshabilitado** (comentado)            |

### Problemas de seguridad detectados

1. **ProtectedRoute deshabilitado** — cualquiera que llegue a `/app` puede ver el dashboard sin autenticarse
2. **Firebase importado sin uso** — superficie de ataque innecesaria
3. **Supabase anon key expuesta en el frontend** — normal en Supabase, pero requiere RLS estricto
4. **Tabla `invite_codes` sin RLS verificado** — el frontend hace SELECT/UPDATE directo; un atacante podría enumerar o marcar códigos como usados
5. **No hay rate limiting** en las API routes — vulnerable a fuerza bruta y abuso
6. **No hay validación server-side del invite code** — la validación solo ocurre en el cliente
7. **Cookie `bruuk_access` sin firma** — cualquiera puede setear `bruuk_access=1` manualmente
8. **Google OAuth redirect sin validación** — el `redirectTo` se construye desde `window.location.origin` (bajo riesgo, pero auditable)

---

## 2. Arquitectura objetivo

```
                     ┌─────────────────────────────────────┐
                     │            INTERNET                  │
                     └──────────────┬──────────────────────┘
                                    │
                     ┌──────────────▼──────────────────────┐
                     │      Vercel Edge Middleware          │
                     │  - Cookie firmada (HMAC)             │
                     │  - Protege /app/*                    │
                     └──────────────┬──────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
  ┌────────▼────────┐    ┌─────────▼─────────┐    ┌────────▼────────┐
  │  Landing (/)     │    │  Login (/login)   │    │  App (/app)     │
  │  Pública         │    │  Supabase Auth    │    │  Protegida      │
  └─────────────────┘    └─────────┬─────────┘    └────────┬────────┘
                                    │                        │
                         ┌──────────▼────────────────────────▼──┐
                         │           SUPABASE                    │
                         │                                       │
                         │  Auth ─── Usuarios + Sessions         │
                         │  DB   ─── Postgres + RLS              │
                         │  Edge ─── Edge Functions (futuro)     │
                         │  Storage ─ Archivos (futuro)          │
                         └───────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    │                     │                      │
            ┌───────▼───────┐   ┌────────▼────────┐   ┌────────▼────────┐
            │  Beehiiv      │   │  Resend         │   │  Google Sheets  │
            │  Newsletter   │   │  Email transc.  │   │  Backup data    │
            └───────────────┘   └─────────────────┘   └─────────────────┘
```

---

## 3. Plan de implementación por fases

### Fase 0 — Parchar lo urgente (seguridad inmediata)

**Objetivo:** cerrar las vulnerabilidades existentes antes de construir más.

#### 0.1 Reactivar ProtectedRoute

```tsx
// ProtectedRoute.tsx
if (!session) return <Navigate to="/login" replace />;
```

Restaurar la línea comentada. Sin esto, `/app` es público.

#### 0.2 Configurar RLS en Supabase

Ir a **Supabase Dashboard → Database → invite_codes → Policies**:

```sql
-- Habilitar RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Solo permitir leer códigos no usados (para validación)
CREATE POLICY "Anon puede verificar código"
  ON invite_codes FOR SELECT
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden marcar como usado
CREATE POLICY "Auth puede usar código"
  ON invite_codes FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (used = true);

-- Nadie puede insertar o borrar desde el frontend
-- (solo desde el dashboard de Supabase o con service_role key)
```

#### 0.3 Eliminar Firebase

Eliminar la dependencia ya que no se usa:

```bash
npm uninstall firebase
```

Borrar `src/lib/firebase.ts`. Menos código = menos superficie de ataque.

#### 0.4 Firmar la cookie de acceso

Reemplazar la cookie plana `bruuk_access=1` con un HMAC:

```ts
// api/enter.ts
import { createHmac } from 'crypto';

const SECRET = process.env.ACCESS_TOKEN!;

function signCookie(value: string): string {
  const sig = createHmac('sha256', SECRET).update(value).digest('hex');
  return `${value}.${sig}`;
}

function verifyCookie(raw: string): boolean {
  const [value, sig] = raw.split('.');
  if (!value || !sig) return false;
  const expected = createHmac('sha256', SECRET).update(value).digest('hex');
  return sig === expected;
}

// Al setear: signCookie('1')  → "1.a3f8c2..."
// Al verificar en middleware: verifyCookie(cookieValue)
```

Actualizar `middleware.ts` para verificar la firma contra una variable de entorno.

---

### Fase 1 — Base de datos y modelo de datos

**Objetivo:** estructurar Supabase como backend real.

#### 1.1 Tablas principales

```sql
-- Perfiles de usuario (se crea automáticamente al registrarse)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  invite_code_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para crear perfil al registrarse
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Invite codes (ya existe, agregar constraints)
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Spots (para cuando sean dinámicos)
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  colonia TEXT NOT NULL,
  descripcion TEXT,
  foto_url TEXT,
  horario TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  nuevo BOOLEAN DEFAULT true,
  activo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  lugar TEXT,
  categoria TEXT,
  color TEXT DEFAULT '#8b7cf6',
  link TEXT,
  organizador TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Planes
CREATE TABLE planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  color TEXT DEFAULT '#8b7cf6',
  duracion TEXT,
  nivel TEXT,
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.2 RLS para cada tabla

```sql
-- Profiles: solo puedes ver/editar el tuyo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver propio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Editar propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Spots, Eventos, Planes: lectura autenticada, escritura admin
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados
CREATE POLICY "Leer spots" ON spots FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = true);

CREATE POLICY "Leer eventos" ON eventos FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = true);

CREATE POLICY "Leer planes" ON planes FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = true);

-- Escritura solo para admins (via service_role o custom claim)
-- No se crean políticas INSERT/UPDATE/DELETE para el anon/authenticated role
-- Los admins usan el dashboard de Supabase o una API con service_role key
```

---

### Fase 2 — Seguridad avanzada

#### 2.1 Rate limiting en APIs

Agregar un rate limiter simple con Vercel KV o un Map en memoria:

```ts
// api/_lib/rateLimit.ts
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // permitido
  }

  if (entry.count >= limit) return false; // bloqueado

  entry.count++;
  return true; // permitido
}
```

Aplicar en `/api/enter`, `/api/join`, `/api/welcome`.

#### 2.2 Validar invite codes en el servidor

Mover la validación de invite codes a una Vercel Function:

```
POST /api/verify-invite
Body: { code: "BRUUK-XXXX" }
→ Usa SUPABASE_SERVICE_ROLE_KEY (server-side, no expuesta)
→ Valida el código y lo marca como usado atómicamente
→ Retorna { valid: true/false }
```

Esto evita que un usuario manipule el frontend para saltarse la validación.

#### 2.3 Headers de seguridad

Agregar en `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com data:; connect-src 'self' https://*.supabase.co https://api.beehiiv.com https://api.resend.com;"
        }
      ]
    }
  ]
}
```

#### 2.4 Configuración de Supabase Auth

En **Supabase Dashboard → Authentication → Settings**:

| Setting                          | Valor recomendado               |
|----------------------------------|---------------------------------|
| Confirm email                    | ON                              |
| Secure email change              | ON                              |
| Password min length              | 8                               |
| Rate limit signup                | 5 por hora                      |
| Rate limit token refresh         | 30 por hora                     |
| JWT expiry                       | 3600 (1 hora)                   |
| Refresh token rotation           | ON                              |
| Refresh token reuse interval     | 10 segundos                     |
| Redirect URLs (whitelist)        | Solo tu dominio exacto          |
| Mailer OTP expiry                | 3600                            |

---

### Fase 3 — Migrar datos estáticos al backend

**Objetivo:** los datos de spots, eventos y planes vienen de Supabase, no hardcodeados.

#### 3.1 Poblar datos iniciales

Crear un script SQL seed con los datos actuales del frontend:

```sql
INSERT INTO spots (nombre, tipo, colonia, descripcion, foto_url, horario, nuevo) VALUES
('La Azotea sin nombre', 'Bar / Terraza', 'Roma Norte', 'Subir por una escalera...', 'https://images.unsplash.com/...', 'Jue–Dom 19:00–2:00', true),
-- ... etc
```

#### 3.2 Hook en el dashboard

```tsx
// Reemplazar los arrays estáticos con queries
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

function useSpots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('spots')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSpots(data ?? []);
        setLoading(false);
      });
  }, []);

  return { spots, loading };
}
```

#### 3.3 Panel admin (futuro)

Para gestionar spots/eventos/planes sin tocar código:

- **Opción rápida:** Usar el dashboard de Supabase directamente (Table Editor)
- **Opción escalable:** Crear una ruta `/app/admin` protegida con un custom claim `is_admin`

```sql
-- Marcar un usuario como admin
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'
WHERE email = 'tu@correo.com';
```

---

### Fase 4 — Monitoreo y observabilidad

| Herramienta         | Para qué                          | Costo   |
|---------------------|----------------------------------|---------|
| Vercel Analytics    | Ya instalado — tráfico web        | Gratis  |
| Supabase Dashboard  | Queries, auth logs, DB health     | Gratis  |
| Vercel Logs         | Errores en serverless functions   | Gratis  |
| Sentry (futuro)     | Error tracking en frontend        | Gratis  |

---

## 4. Variables de entorno requeridas

### Frontend (Vercel → Environment Variables)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Server-side (Vercel → Environment Variables, NO expuestas al frontend)

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...     # Solo para APIs server-side
BEEHIIV_API_KEY=bh_...
BEEHIIV_PUB_ID=pub_...
GOOGLE_SCRIPT_URL=https://script.google.com/...
SHEETS_SECRET=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hola@bruuk.com
ACCESS_TOKEN=...                           # Password del gate /app
```

**Nunca** poner `SUPABASE_SERVICE_ROLE_KEY` en una variable `VITE_*` — Vite la incluiría en el bundle público.

---

## 5. Checklist de seguridad

- [ ] Reactivar ProtectedRoute (quitar el TODO/comentario)
- [ ] Configurar RLS en `invite_codes`
- [ ] Eliminar Firebase (dependencia sin uso)
- [ ] Firmar cookie `bruuk_access` con HMAC
- [ ] Agregar headers de seguridad en `vercel.json`
- [ ] Configurar auth settings en Supabase (JWT expiry, rate limits, etc.)
- [ ] Rate limiting en API routes
- [ ] Mover validación de invite codes al servidor
- [ ] Crear tabla `profiles` con trigger
- [ ] Crear tablas `spots`, `eventos`, `planes` con RLS
- [ ] Migrar datos hardcodeados a Supabase
- [ ] Verificar que `SUPABASE_SERVICE_ROLE_KEY` nunca esté en variables `VITE_*`
- [ ] Activar Refresh Token Rotation en Supabase
- [ ] Whitelist de redirect URLs en Supabase Auth

---

## 6. Prioridad de ejecución

| Prioridad | Tarea                                | Esfuerzo  |
|-----------|-------------------------------------|-----------|
| P0        | Reactivar ProtectedRoute            | 5 min     |
| P0        | RLS en invite_codes                 | 15 min    |
| P0        | Eliminar Firebase                   | 5 min     |
| P0        | Headers de seguridad                | 10 min    |
| P1        | Firmar cookie HMAC                  | 30 min    |
| P1        | Rate limiting en APIs               | 45 min    |
| P1        | Validar invite codes server-side    | 1 hr      |
| P1        | Config Supabase Auth settings       | 15 min    |
| P2        | Tablas + RLS (profiles, spots, etc.)| 1 hr      |
| P2        | Trigger handle_new_user             | 15 min    |
| P3        | Migrar datos a Supabase             | 2 hrs     |
| P3        | Hooks para queries dinámicas        | 2 hrs     |
| P4        | Panel admin                         | 4+ hrs    |
| P4        | Sentry / error tracking             | 30 min    |
