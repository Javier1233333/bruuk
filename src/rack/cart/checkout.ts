/* ============================================================
   startCheckout — llama a POST /api/rack/checkout y devuelve
   la URL de la sesión de Stripe, o un mensaje de error legible.
   El servidor valida precios y disponibilidad; aquí solo se
   mandan los ids.
   ============================================================ */

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

export async function startCheckout(productIds: string[]): Promise<CheckoutResult> {
  try {
    const res = await fetch('/api/rack/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: productIds.map((id) => ({ id })) }),
    });

    const body = await res.json().catch(() => null);

    if (res.ok && body?.url) {
      return { ok: true, url: body.url };
    }

    if (res.status === 409) {
      return { ok: false, error: 'Alguien se adelantó con una o más piezas. Actualiza la página.' };
    }
    if (res.status === 503) {
      return { ok: false, error: 'Los pagos aún no están activos. Vuelve pronto.' };
    }
    return { ok: false, error: body?.error ?? 'No se pudo iniciar el pago. Intenta de nuevo.' };
  } catch {
    return { ok: false, error: 'Sin conexión. Revisa tu internet e intenta de nuevo.' };
  }
}
