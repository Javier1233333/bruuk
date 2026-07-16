# AUTH_IMPROVEMENT_PLAN.md — Plan de Mejora de Autenticación

Basado en `AUTH_AUDIT.md` (julio 2026). Orden de ejecución acordado, de mayor a menor urgencia.

---

## Tarea 1 — Corregir URL de redirección en Supabase (CRÍTICO)

**Problema:** Site URL en Supabase apunta a `localhost:3000`, rompiendo todos los emails de confirmación en producción.

**Dónde:** Configuración externa (Supabase Dashboard), no código — pero hay que verificar que el código no tenga URLs hardcodeadas que contradigan la config correcta.

**Qué hacer:**
1. En Supabase Dashboard → Auth → URL Configuration:
   - Site URL: URL real de producción en Vercel (ej. `https://bruuk.vercel.app` o dominio custom)
   - Redirect URLs: agregar `https://<dominio-produccion>/setup`, `https://<dominio-produccion>/reset-password`, y las versiones de `localhost:5173` para desarrollo local.
2. Verificar en código (`authService.ts`) que `emailRedirectTo` use `window.location.origin` dinámicamente (ya lo hace según la auditoría) — así se adapta solo entre dev y producción, siempre que el Redirect URL esté en la whitelist de Supabase.
3. Confirmar que las variables de entorno de Supabase (`.env` en Vercel) apuntan al proyecto correcto.

**Verificación:** Registrar un usuario de prueba real, confirmar que el email llega con la URL correcta y el link funciona sin error de conexión.

**Nota:** Esta tarea es mayormente de configuración externa — Antigravity puede guiarte en el código, pero el cambio real ocurre en el dashboard de Supabase, que tú debes hacer manualmente.

---

## Tarea 2 — Validación de username en tiempo real

**Problema:** No hay chequeo de disponibilidad antes de intentar guardar; el usuario descubre el conflicto con un error genérico de base de datos.

**Archivos a tocar:**
- `packages/shared-logic/src/services/userService.ts` — nueva función `checkUsernameAvailability(username: string)`
- `apps/web/src/pages/ProfileSetupPage.tsx` — debounce + estado de disponibilidad + UI de feedback

**Qué hacer:**
1. En `userService.ts`, agregar función que consulte `profiles` por `username` exacto y retorne `boolean` (disponible o no).
2. En `ProfileSetupPage.tsx`, agregar un hook de debounce (300-500ms) que llame a la función mientras el usuario escribe.
3. Mostrar estado visual: "Verificando...", "✓ Disponible", "✗ Ya está en uso" debajo del input.
4. Deshabilitar el botón "Continuar" mientras el username esté tomado o se esté verificando.

---

## Tarea 3 — Recuperación de contraseña

**Problema:** No existe la funcionalidad.

**Archivos a crear/tocar:**
- `packages/shared-logic/src/services/authService.ts` — agregar `requestPasswordReset(email)` y `updatePassword(newPassword)`
- `apps/web/src/pages/ForgotPasswordPage.tsx` — nueva página
- `apps/web/src/pages/ResetPasswordPage.tsx` — nueva página
- `apps/web/src/main.tsx` (o donde estén las rutas) — agregar `/forgot-password` y `/reset-password`
- `apps/web/src/pages/LoginPage.tsx` — agregar link "¿Olvidaste tu contraseña?"

**Qué hacer:**
1. `authService.requestPasswordReset(email)` → `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
2. `authService.updatePassword(newPassword)` → `supabase.auth.updateUser({ password: newPassword })`
3. `ForgotPasswordPage`: formulario de un campo (email), botón de envío, mensaje de confirmación.
4. `ResetPasswordPage`: formulario de nueva contraseña (con la misma validación de fortaleza que signup: 8+ caracteres, mayúscula, minúscula, número), confirmación, redirección a `/app` tras éxito.
5. Agregar las rutas nuevas en el router.
6. Agregar el link visible en `LoginPage.tsx`.

---

## Tarea 4 — Resend de email de confirmación

**Problema:** Si el usuario no recibe o pierde el email de confirmación, no tiene forma de reenviarlo.

**Archivos a tocar:**
- `packages/shared-logic/src/services/authService.ts` — agregar `resendConfirmationEmail(email)`
- `apps/web/src/pages/LoginPage.tsx` — detectar error de "email no confirmado" y mostrar botón de reenvío

**Qué hacer:**
1. `authService.resendConfirmationEmail(email)` → `supabase.auth.resend({ type: 'signup', email })`
2. En el flujo de login, cuando Supabase devuelva el error específico de email no confirmado, mostrar un botón "Reenviar correo de confirmación" en vez del error genérico.
3. Mensaje de confirmación tras reenviar ("Te enviamos un nuevo correo, revisa tu bandeja y spam").

---

## Tarea 5 — Forzar verificación de invite_codes

**Problema:** Un usuario puede registrarse, confirmar email, y acceder a `/app` sin pasar por `/verify`, saltándose el control de invitaciones.

**Archivos a tocar:**
- `apps/web/src/components/ProtectedRoute.tsx`

**Qué hacer:**
1. En `ProtectedRoute.tsx`, agregar chequeo: si `user.user_metadata?.invite_verified` no es `true`, redirigir a `/verify` en vez de permitir acceso a `/setup` o `/app`.
2. Confirmar que `/verify` en sí no cause loop infinito (debe ser accesible sin pasar este chequeo).
3. Probar el flujo completo: registro → confirmación de email → debe ir a `/verify` antes que a `/setup`.

**Precaución:** esto cambia el comportamiento de acceso para usuarios ya registrados sin invite_verified. Confirmar con Luis si hay usuarios reales ya en producción que se verían afectados antes de desplegar.

---

## Tarea 6 — OAuth completo (Google + Apple)

**Problema:** El código ya tiene los botones y la función `signInWithOAuth`, pero depende de configuración externa que falta.

**Qué hacer (mayormente configuración externa):**
1. Google Cloud Console: crear credenciales OAuth 2.0, configurar dominios autorizados.
2. Apple Developer: configurar Sign in with Apple, generar Service ID y claves.
3. En Supabase Dashboard → Auth → Providers: activar Google y Apple, pegar credenciales.
4. Probar el flujo completo: click en botón → redirección a proveedor → vuelta a la app → creación de perfil vía trigger `handle_new_user`.
5. Verificar que el trigger de creación de perfil funcione igual para usuarios OAuth que para email/password (username autogenerado, avatar por defecto, etc.)

**Nota:** Esta tarea depende de que tengas cuentas de desarrollador en Google Cloud y Apple Developer Program ($99/año para Apple). Si no las tienes todavía, esta tarea queda bloqueada hasta resolver eso — avísame si es el caso para reordenar el plan.

---

## Orden de ejecución y dependencias

```
Tarea 1 (URL) ──► independiente, hazla primero siempre
Tarea 2 (username) ──► independiente
Tarea 3 (password reset) ──► independiente
Tarea 4 (resend email) ──► depende conceptualmente de Tarea 1 (URLs correctas)
Tarea 5 (forzar invite) ──► independiente, pero requiere tu confirmación de usuarios existentes
Tarea 6 (OAuth) ──► depende de credenciales externas que debes generar tú
```

No hay bloqueos duros entre tareas 2-5 — se pueden hacer en cualquier orden, pero el orden priorizado ya refleja impacto/esfuerzo.
