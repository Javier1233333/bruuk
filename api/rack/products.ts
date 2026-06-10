import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, supabaseAdmin } from './supabase';

/* ============================================================
   /api/rack/products
   GET  ?category=pre-owned|artesanal   → lista filtrada
   GET  ?slug=chamarra-bomber-vintage   → producto individual
   POST body: { title, slug, price, ... } → crear producto
        Requiere header `x-admin-key` = RACK_ADMIN_KEY (env)
   ============================================================ */

// Comparación en tiempo constante para no filtrar la clave por timing
function isAdmin(req: VercelRequest): boolean {
  const expected = process.env.RACK_ADMIN_KEY;
  const provided = req.headers['x-admin-key'];
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Transform DB row → frontend shape
function toProduct(row: Record<string, unknown>, creator: Record<string, unknown> | null) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    category: row.category,
    status: row.status,
    images: row.images ?? [],
    colorPlaceholder: row.color_placeholder,
    creator: creator
      ? { id: creator.id, name: creator.name, bio: creator.bio, avatar: creator.avatar, color: creator.color }
      : undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    condition: row.condition,
    story: row.story,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  // ── GET ──────────────────────────────────────────────
  if (req.method === 'GET') {
    const { category, slug } = req.query;

    // Single product by slug
    if (typeof slug === 'string') {
      const { data, error } = await supabase
        .from('rack_products')
        .select('*, rack_creators(*)')
        .eq('slug', slug)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Pieza no encontrada' });

      const creator = data.rack_creators as Record<string, unknown> | null;
      return res.status(200).json(toProduct(data, creator));
    }

    // List products (optionally filtered)
    let query = supabase
      .from('rack_products')
      .select('*, rack_creators(*)')
      .order('created_at', { ascending: false });

    if (typeof category === 'string' && (category === 'pre-owned' || category === 'artesanal')) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    const products = (data ?? []).map((row) => {
      const creator = row.rack_creators as Record<string, unknown> | null;
      return toProduct(row, creator);
    });

    return res.status(200).json(products);
  }

  // ── POST — Crear producto (solo admin) ───────────────
  if (req.method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const body = req.body;

    if (!body?.title || !body?.slug || !body?.price || !body?.category) {
      return res.status(400).json({
        error: 'Campos requeridos: title, slug, price, category',
        example: {
          title: 'Chamarra vintage',
          slug: 'chamarra-vintage',
          description: 'Una pieza increíble',
          price: 500,
          category: 'pre-owned',
          status: 'disponible',
          color_placeholder: '#1a1a2e',
          creator_id: null,
          tags: ['vintage', 'ropa'],
          condition: 'Bueno',
          story: 'Historia de la pieza',
        },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('rack_products')
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description ?? '',
        price: body.price,
        currency: body.currency ?? 'MXN',
        category: body.category,
        status: body.status ?? 'disponible',
        images: body.images ?? [],
        color_placeholder: body.color_placeholder ?? '#0a0a0f',
        creator_id: body.creator_id ?? null,
        tags: body.tags ?? [],
        condition: body.condition ?? null,
        story: body.story ?? null,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
