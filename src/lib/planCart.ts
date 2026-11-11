import { useSyncExternalStore } from 'react';
import { ROULETTE_MAX_STOPS } from '../data/planBuilder';

/* ============================================================
   "Mi plan": los lugares que la persona va juntando desde Spots
   o desde la ruleta, en orden. Vive en localStorage (sin cuenta)
   y es el mismo en todas las pantallas: lo que agregas en Spots
   aparece en "Arma tu plan" listo para armarlo.
   ============================================================ */

const STORAGE_KEY = 'bruuk:mi-plan';
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    cache = Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string').slice(0, ROULETTE_MAX_STOPS) : [];
  } catch {
    // Modo privado o almacenamiento bloqueado: se queda en memoria.
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* sin almacenamiento: dura lo que dure la pestaña */ }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const usePlanCart = () => useSyncExternalStore(subscribe, read, () => [] as string[]);

// Regresa false si ya estaba lleno.
export function addToPlan(id: string): boolean {
  const current = read();
  if (current.includes(id)) return true;
  if (current.length >= ROULETTE_MAX_STOPS) return false;
  write([...current, id]);
  return true;
}

export const removeFromPlan = (id: string) => write(read().filter((item) => item !== id));
export const setPlan = (ids: string[]) => write([...new Set(ids)].slice(0, ROULETTE_MAX_STOPS));
export const clearPlan = () => write([]);
