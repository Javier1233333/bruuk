import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RackProduct, ProductCategory } from '../types/rack';

/* ============================================================
   Carrito de Rack — todas las piezas son únicas (qty siempre 1).
   Se persiste en localStorage. El servidor revalida precios y
   disponibilidad al hacer checkout — esto es solo UI state.
   ============================================================ */

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  category: ProductCategory;
  colorPlaceholder: string;
  image?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  has: (productId: string) => boolean;
  addItem: (product: RackProduct) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'rack-cart-v1';

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        typeof it?.id === 'string' && typeof it?.slug === 'string' &&
        typeof it?.title === 'string' && typeof it?.price === 'number'
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage lleno o bloqueado — el carrito sigue en memoria
    }
  }, [items]);

  const addItem = useCallback((product: RackProduct) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === product.id)) return prev;
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          category: product.category,
          colorPlaceholder: product.colorPlaceholder,
          image: product.images[0],
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      total: items.reduce((sum, it) => sum + it.price, 0),
      has: (productId: string) => items.some((it) => it.id === productId),
      addItem,
      removeItem,
      clear,
    }),
    [items, addItem, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
