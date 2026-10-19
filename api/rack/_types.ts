/* Tipos compartidos para las API de Rack — mirror de src/rack/types/rack.ts */

export type ProductCategory = 'pre-owned' | 'artesanal';
export type ProductStatus = 'disponible' | 'apartado' | 'agotado';

export interface Creator {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  color: string;
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
  colorPlaceholder: string;
  creator?: Creator;
  tags: string[];
  createdAt: string;
  condition?: string;
  story?: string;
}

export interface Drop {
  id: string;
  date: string;
  dateISO: string;
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
