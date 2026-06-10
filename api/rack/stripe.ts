import Stripe from 'stripe';

/* Cliente Stripe compartido por checkout.ts y webhook.ts.
   Lazy: solo se instancia si STRIPE_SECRET_KEY existe, para que
   el resto de la API funcione aunque Stripe no esté configurado. */

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}
