# RACK por BRUUK — Configuración de Stripe

Todo el código ya está listo. Solo faltan las claves. Sigue estos pasos en orden.

---

## Cómo funciona (resumen)

```
Usuario                    Tu API (Vercel)                 Stripe
  │  PAGAR CON TARJETA        │                              │
  ├──────────────────────────▶│ POST /api/rack/checkout      │
  │                           │ 1. Lee PRECIOS desde la DB   │
  │                           │    (nunca confía en el       │
  │                           │     precio del navegador)    │
  │                           │ 2. Aparta las piezas         │
  │                           │    (disponible → apartado)   │
  │                           ├─────────────────────────────▶│ crea Checkout Session (30 min)
  │◀──────────────────────────┤ { url }                      │
  │  redirect a Stripe ──────────────────────────────────────▶ paga en la página de Stripe
  │                           │◀─────────────────────────────┤ webhook checkout.session.completed
  │                           │ 3. Verifica la FIRMA         │
  │                           │ 4. orden → paid              │
  │                           │    piezas → agotado          │
  │◀── redirect /rack/gracias │                              │
```

- **Los datos de tarjeta nunca tocan tu servidor** — el formulario de pago es de Stripe (PCI compliant).
- Si el usuario abandona, la sesión expira a los 30 min y el webhook **libera las piezas** automáticamente (apartado → disponible).
- Si dos personas intentan comprar la misma pieza única, la reserva atómica en Postgres garantiza que solo una gana; la otra recibe "Alguien se adelantó".

---

## Paso 1 — Base de datos

Corre `supabase-setup.sql` completo en Supabase → SQL Editor.

> Si ya lo habías corrido antes, **vuélvelo a correr**: la versión nueva agrega la tabla `rack_orders` y elimina unas políticas RLS que dejaban escribir a cualquier visitante anónimo (hueco de seguridad corregido).

## Paso 2 — Claves de Stripe

1. Crea una cuenta en [stripe.com](https://stripe.com) (o entra a la tuya).
2. Ve a **Developers → API keys** (modo **Test** primero).
3. Copia la **Secret key** (`sk_test_...`).

## Paso 3 — Webhook

### En producción (Vercel)
1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. URL: `https://TU-DOMINIO/api/rack/webhook`
3. Eventos a escuchar: `checkout.session.completed` y `checkout.session.expired`.
4. Copia el **Signing secret** (`whsec_...`).

### En local (para probar)
```bash
# instala el CLI de stripe: brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/rack/webhook
# imprime un whsec_... temporal → úsalo como STRIPE_WEBHOOK_SECRET en .env
```

## Paso 4 — Variables de entorno

Rellena en `.env` (local) y en **Vercel → Settings → Environment Variables** (producción):

| Variable | Valor | Dónde se usa |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` / `sk_live_...` | checkout y webhook |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | verificar firma del webhook |
| `RACK_ADMIN_KEY` | genera con `openssl rand -hex 32` | crear productos vía API |
| `SITE_URL` | `https://tudominio.com` | redirects de Stripe |

⚠️ Ninguna de estas lleva prefijo `VITE_` — son secretas y solo viven en el servidor. Una variable con `VITE_` se incrusta en el JavaScript del navegador y queda expuesta.

## Paso 5 — Probar

1. `vercel dev` (las funciones `/api` no corren con `npm run dev` a secas).
2. Abre `/rack/explorar`, agrega una pieza al carrito y paga con la tarjeta de prueba:
   - Número: `4242 4242 4242 4242`, fecha futura cualquiera, CVC cualquiera.
3. Verifica que después del pago la pieza aparece como **agotada** y `/rack/gracias` muestra la orden.
4. Prueba el caso contrario: inicia un pago, ciérralo, y a los 30 min la pieza vuelve a estar disponible (evento `checkout.session.expired`).

## Paso 6 — Pasar a producción

1. Activa tu cuenta de Stripe (datos fiscales/bancarios).
2. Cambia a las claves **Live** (`sk_live_...`) en Vercel.
3. Crea el webhook de producción (Paso 3) apuntando a tu dominio real.

---

## API REST de Rack

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/rack/products` | pública | catálogo (`?category=`, `?slug=`) |
| `POST` | `/api/rack/products` | header `x-admin-key` | crear producto |
| `GET` | `/api/rack/drops` | pública | próximos drops |
| `GET` | `/api/rack/events` | pública | eventos Bruuk |
| `POST` | `/api/rack/checkout` | pública (valida todo en servidor) | inicia pago |
| `POST` | `/api/rack/webhook` | firma de Stripe | confirma/expira órdenes |
| `GET` | `/api/rack/orders?session_id=` | el session_id actúa de token | resumen de orden (sin datos sensibles) |

Ejemplo para subir un producto:

```bash
curl -X POST https://TU-DOMINIO/api/rack/products \
  -H "Content-Type: application/json" \
  -H "x-admin-key: TU_RACK_ADMIN_KEY" \
  -d '{
    "title": "Chamarra vintage",
    "slug": "chamarra-vintage",
    "price": 500,
    "category": "pre-owned",
    "condition": "Bueno",
    "story": "Historia de la pieza"
  }'
```

## Decisiones de seguridad ya aplicadas

- Precios y disponibilidad se leen **siempre de la base de datos** en el servidor; el carrito del navegador es solo UI.
- Webhook con **verificación de firma** sobre el body crudo — nadie puede falsificar un "pago completado".
- Reserva **atómica** de piezas únicas (`UPDATE ... WHERE status='disponible'`) — sin doble venta por race condition.
- `rack_orders` tiene RLS **sin políticas públicas**: contiene emails y solo el servidor la lee.
- `POST /products` protegido con `RACK_ADMIN_KEY` comparada en **tiempo constante**.
- Se eliminó el CORS `*` de los endpoints (la app es same-origin).
- El endpoint de órdenes devuelve solo título/precio/estado — **nunca el email** del cliente.
