# Auditoría de Autenticación - Bruuk

Este documento detalla el análisis del flujo completo de autenticación y registro de Bruuk en la rama `migration/monorepo`, identificando fortalezas, problemas críticos y un plan de mejoras recomendado.

---

## 1. Flujo de Registro Actual

Un nuevo usuario sigue los siguientes pasos para registrarse en la aplicación:

1. **Acceso al formulario:** Navega a la página de login (`/login`) controlada por [LoginPage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/LoginPage.tsx) y selecciona la pestaña "Registrarse" (cambia el estado local `mode` a `'signup'`).
2. **Entrada de Credenciales:** Rellena los campos de **Email** y **Contraseña** (que ahora valida mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número).
3. **Petición de registro:** Al enviar, se ejecuta `authService.signUp` en [authService.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/services/authService.ts), enviando las credenciales junto con el redirect dinámico:
   ```typescript
   emailRedirectTo: window.location.origin + '/setup'
   ```
4. **Inserción y Trigger de Perfil:** Si Supabase acepta el registro, guarda al usuario en `auth.users` y se dispara la función trigger `public.handle_new_user()` en PostgreSQL ([schema.sql:L102-L133](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/supabase/schema.sql#L102-L133)). Esta función:
   - Toma el email o metadata para generar un `username` base.
   - Resuelve de manera automática cualquier colisión agregando un sufijo numérico (ej. `usuario1`, `usuario2`).
   - Inserta la fila correspondiente en la tabla `public.profiles` con `avatar_id: 'avatar1'` y `role: 'explorer'`.
5. **Verificación de Email:** La UI muestra el mensaje `'¡Cuenta creada! Revisa tu correo para confirmarla.'`. El usuario recibe un correo electrónico de confirmación con un enlace de Supabase.
6. **Redirección de Confirmación:** Al hacer clic en el enlace, Supabase verifica el token, inicia la sesión en el navegador y lo redirige a la URL `/setup` (según `emailRedirectTo`).
7. **Completado de Datos en el Perfil (Setup):** El componente [ProtectedRoute.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/components/ProtectedRoute.tsx) detecta que el usuario tiene la sesión activa pero su perfil está incompleto (falta `city` o `username` en su fila de la tabla `profiles`), redirigiéndolo a `/setup` ([ProfileSetupPage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/ProfileSetupPage.tsx)).
8. **Pasos de /setup:**
   - **Paso 1:** Confirma su nombre de usuario (input "Usuario", que se guarda en la columna `username` e `instagram` por compatibilidad legacy) y elige su Ciudad.
   - **Paso 2:** Selecciona mínimo 3 intereses.
   - **Paso 3:** Selecciona o ingresa una actividad favorita.
9. **Finalización:** Se ejecuta `userService.updateProfile`, que actualiza la fila correspondiente en `public.profiles`, sincroniza el estado en el store de Zustand y redirige al Dashboard en `/app`.

### Verificación de Email
El flujo requiere que el usuario haga clic en un enlace de confirmación enviado por Supabase. Cuando el enlace es visitado, Supabase crea la sesión en el cliente y redirige a `/setup`.

### Estructura de Datos (Campos Específicos)
- **`auth.users` (Esquema Interno de Supabase Auth):**
  - `id` (UUID, Primary Key)
  - `email` (Dirección de correo)
  - `encrypted_password` (Hash de la contraseña)
  - `raw_user_meta_data` (Almacena metadatos como `invite_verified: true` tras validar el código)
  - Auditoría estándar (`email_confirmed_at`, `created_at`, etc.)
- **`public.profiles` (Tabla de Perfiles personalizada, [schema.sql:L75-L86](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/supabase/schema.sql#L75-L86)):**
  - `id` (UUID, Foreign Key a `auth.users(id)` con eliminación en cascada)
  - `username` (Text, Unique)
  - `instagram` (Text, para compatibilidad heredada)
  - `avatar_id` (Text, por defecto `'avatar1'`)
  - `city` (Text)
  - `interests` (Array de Texts, intereses del usuario)
  - `favorite_plan` (Text, actividad predilecta)
  - `role` (Enum `user_role` de tipo `'explorer'`, `'host'` o `'admin'`, por defecto `'explorer'`)
  - Auditoría estándar (`created_at`, `updated_at`)

### Sistema de Invitaciones (`invite_codes`)
- **Funcionamiento:** Existe una tabla `public.invite_codes` y una función RPC en base de datos llamada `verify_and_use_invite_code(user_code)` ([schema.sql:L21-L59](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/supabase/schema.sql#L21-L59)).
- **Validación:** Se valida en [VerifyInvitePage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/VerifyInvitePage.tsx) llamando a `userService.verifyInviteCode(code)`.
- **FALLA DE SEGURIDAD DETECTADA:** El flujo de invitaciones **no está forzado** en el frontend ni en el middleware de rutas. Un usuario registrado que confirme su email puede acceder libremente a `/app` y omitir completamente la verificación del código de invitación (la ruta `/verify` existe pero no hay redirección automática hacia ella si no está verificado).

### Validación de Username
- **Base de datos:** La tabla `profiles` tiene una restricción `UNIQUE` en la columna `username`.
- **Frontend:** En [ProfileSetupPage.tsx:L184](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/ProfileSetupPage.tsx#L184), solo se limpian caracteres inválidos en tiempo real (remplazando caracteres fuera de `a-z`, `A-Z`, `0-9`, `.`, y `_`).
- **Problema:** No existe una validación de disponibilidad o unicidad de username previa en el cliente. Si el usuario escribe un username ya en uso, el guardado de perfil fallará con un error genérico de base de datos capturado en el `catch`.

---

## 2. Flujo de Login Actual

- **Métodos disponibles:** Actualmente se admite **Email y Contraseña** a través de `authService.signInWithPassword`.
- **OAuth (Google y Apple):** Los botones y funciones (`handleGoogleLogin`, `handleAppleLogin`) ya están implementados en [LoginPage.tsx:L63-L75](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/LoginPage.tsx#L63-L75) llamando a `authService.signInWithOAuth`. Sin embargo, su funcionamiento depende de que el propietario del proyecto los configure en la sección **Auth -> Providers** de la consola de Supabase.
- **Persistencia de sesión:** Sí, funciona. Supabase está configurado con `persistSession: true` y un adaptador de almacenamiento personalizado en [supabaseClient.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/lib/supabaseClient.ts). Al recargar la página, `initialize()` en [sessionStore.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/stores/sessionStore.ts#L28) restablece el estado de autenticación y carga el perfil del usuario.
- **Control de acceso sin autenticación:** Al intentar entrar a `/app` u otra ruta protegida sin estar logueado, [ProtectedRoute.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/components/ProtectedRoute.tsx#L27-L29) redirige al usuario a la página de login (`/login`), guardando la ruta de origen en el estado del router.

---

## 3. Flujo de Recuperación de Contraseña

- **Estado actual:** **No existe** ninguna interfaz ni flujo de recuperación implementado en el frontend de la aplicación.
- **Archivos a modificar/crear:**
  - **Servicios:** Agregar en [authService.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/services/authService.ts) funciones para:
    - Solicitar el correo de recuperación: `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
    - Actualizar la contraseña de la sesión activa temporal: `supabase.auth.updateUser({ password })`
  - **Páginas:**
    - Crear `ForgotPasswordPage.tsx` para ingresar el correo y enviar el enlace de recuperación.
    - Crear `ResetPasswordPage.tsx` (con ruta `/reset-password`) para que el usuario escriba su nueva contraseña tras hacer clic en el email.
- **Lógica del flujo:**
  1. En `/forgot-password`, el usuario ingresa su email.
  2. Supabase envía un enlace apuntando a `window.location.origin + '/reset-password'`.
  3. Al abrir el correo, Supabase inicia una sesión temporal y redirige a la página web `/reset-password`.
  4. En `/reset-password`, el usuario ingresa la nueva contraseña y se llama a `supabase.auth.updateUser({ password: newPassword })`.
  5. Una vez completado, se le redirige al Dashboard en `/app`.

---

## 4. Problemas Conocidos — URL de Emails Rota

- **Confirmación:** Los correos electrónicos de confirmación/verificación enviados por Supabase fallan y redirigen a `localhost:3000` (puerto de Next.js), en lugar de `localhost:5173` (puerto local de Vite/Capacitor) o la URL de producción.
- **Ubicación de la configuración:** La URL errónea de redirección está configurada en la consola del proyecto de Supabase (sección **Auth -> URL Configuration -> Site URL**), la cual tiene por defecto `http://localhost:3000` al crear un proyecto en Supabase.
- **URL correcta para producción:** Debe ser la dirección de despliegue real (ej. `https://bruuk.app` o la URL provista por Vercel para el frontend).
- **Atrapado:** Sí, si el usuario hace clic en el enlace roto, se encuentra con un error de conexión del navegador y su cuenta no se verifica. Dado que no hay botón de "Reenviar correo" implementado en la UI, el usuario queda atascado a menos que vuelva a registrarse o el administrador confirme su correo manualmente.

---

## 5. UX e Intuitibilidad Actual

- **Mensajes de error:** Hay traducciones básicas para los errores comunes de inicio de sesión de Supabase, pero la experiencia en `/setup` o al fallar la actualización de perfiles es genérica.
- **Instrucciones:** Hay textos explicativos correctos en `/setup`, pero carece de notificaciones claras si las redes de OAuth (Google/Apple) fallan debido a problemas de configuración en el servidor.
- **Compatibilidad móvil:** Con las mejoras responsivas aplicadas a la cuadrícula de intereses de `/setup`, el flujo es mobile-friendly y se adapta correctamente a dispositivos móviles delgados (375px).
- **Falta obvia:**
  - Enlace de "Olvidé mi contraseña" en el login.
  - Mensaje claro al usuario indicando que revise su bandeja de spam tras el registro.
  - Resend de correos de confirmación en caso de que expire el enlace.
  - Bloqueo por middleware o ruta protegida para obligar al usuario a validar su código de invitación en `/verify` si la app es de acceso cerrado.

---

## 6. Mapeo de Componentes y Servicios Relevantes

* [LoginPage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/LoginPage.tsx): Vista del login, registro y botones OAuth.
* [LoginPage.css](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/LoginPage.css): Estilos del login y requisitos de contraseñas.
* [ProfileSetupPage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/ProfileSetupPage.tsx): Lógica del asistente de configuración de perfil.
* [VerifyInvitePage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/VerifyInvitePage.tsx): Vista para validar códigos de invitación.
* [ProtectedRoute.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/components/ProtectedRoute.tsx): Middleware/Guardia de rutas que protege `/app` y redirige a `/setup` si falta información de perfil.
* [AuthContext.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/contexts/AuthContext.tsx): Proveedor de contexto React que envuelve la app para distribuir la sesión del usuario.
* [sessionStore.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/stores/sessionStore.ts): Manejo de sesión global y perfil a través de Zustand.
* [authService.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/services/authService.ts): Envoltura de llamadas a Supabase Auth.
* [userService.ts](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/packages/shared-logic/src/services/userService.ts): Lógica de perfiles y RPC de invitaciones en base de datos.
* [.env](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/.env): Configuración local de variables de Supabase URL y Anon Key.

---

## 7. Plan de Trabajo Recomendado

1. **(CRÍTICO) Corregir URL de redirección en Supabase:**
   - Acceder al panel de Supabase -> Auth -> URL Configuration.
   - Establecer **Site URL** a `http://localhost:5173` (en desarrollo local) o el dominio de producción (ej. `https://bruuk.app`).
   - Agregar `http://localhost:5173/setup` y `https://tu-dominio.com/setup` a los **Redirect URLs** autorizados.
2. **Forzar verificación de código de invitación (invite_codes):**
   - En [ProtectedRoute.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/components/ProtectedRoute.tsx), añadir una regla que revise si `user.user_metadata?.invite_verified` es `true`.
   - Si no está verificado, redirigir automáticamente a `/verify` y no permitir el acceso a `/setup` ni a `/app`.
3. **Implementación de validación de Username (Unicidad en tiempo real):**
   - En `userService.ts`, agregar una función `checkUsernameAvailability(username: string)` que busque si existe una fila en `profiles` con dicho username.
   - En [ProfileSetupPage.tsx](file:///c:/Users/luism/OneDrive/Escritorio/personal-projects/bruuk/apps/web/src/pages/ProfileSetupPage.tsx), añadir un efecto con debounce que consulte la disponibilidad del username mientras el usuario escribe, mostrando un mensaje indicador debajo del campo y deshabilitando el botón "Continuar" si ya está tomado.
4. **Implementar recuperación de contraseña:**
   - Añadir soporte a `authService.ts` para enviar correos de restablecimiento y guardar contraseñas nuevas.
   - Crear las interfaces `/forgot-password` (solicitud) y `/reset-password` (establecimiento) usando estilos coherentes.
5. **Configuración y habilitación de proveedores OAuth (Google / Apple):**
   - Configurar credenciales OAuth de Google Cloud y Apple Developer en la consola de Supabase.
   - Probar que el flujo de `signInWithOAuth` asocie correctamente la cuenta y cree el perfil con el disparador de base de datos.
6. **Añadir opción de Reenvío de Email de confirmación:**
   - En la vista de login, cuando el usuario intente loguearse con una cuenta no confirmada, capturar el error y ofrecer un botón para reenviar el enlace de verificación mediante `supabase.auth.resend({ type: 'signup', email })`.
