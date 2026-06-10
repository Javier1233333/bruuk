/* ============================================================
   RACK por BRUUK — Tipos de datos
   ============================================================ */

export type ProductCategory = 'pre-owned' | 'artesanal';
export type ProductStatus = 'disponible' | 'apartado' | 'agotado';

export interface Creator {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  color: string; // Color de fallback igual que en el app
}

export interface RackProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: 'MXN';
  category: ProductCategory;
  status: ProductStatus;
  images: string[];
  colorPlaceholder: string; // Color sólido cuando no hay foto
  creator?: Creator;
  tags: string[];
  createdAt: string;
  condition?: string; // Solo pre-owned: "Excelente", "Bueno", "Con carácter"
  story?: string;     // Historia de la pieza
}

export interface Drop {
  id: string;
  date: string;        // "18 JUN"
  dateISO: string;     // Para ordenar
  title: string;
  category: ProductCategory;
  pieceCount: number;
  teaser?: string;
}

export interface BruukEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  link: string;
}
