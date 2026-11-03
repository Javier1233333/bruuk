import { auth } from './firebase';
import { SITE_URL } from './catalog';

// Las mismas funciones de Vercel que usa la web. Con sesión se manda el ID token:
// así los límites de uso cuentan por cuenta y no por IP (en datos móviles muchos comparten IP).
async function authHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SITE_URL}/api/${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(await authHeader()) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Sin conexión. Revisa tu internet e inténtalo otra vez.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Algo salió mal. Inténtalo otra vez.');
  return result as T;
}

export const getApi = <T,>(path: string) => request<T>('GET', path);
export const postApi = <T,>(path: string, body: object) => request<T>('POST', path, body);
