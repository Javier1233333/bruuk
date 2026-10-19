import { SITE_URL } from './catalog';

// Las mismas funciones de Vercel que usa la web.
export async function postApi<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${SITE_URL}/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Algo salió mal. Inténtalo otra vez.');
  return result as T;
}
