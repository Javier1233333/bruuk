export type CommunityEvent = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  description: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  neighborhood: string;
  address: string;
  mapsUrl: string;
  image: string;
  imageAlt: string;
  capacity: number;
  priceLabel: string;
  status: 'open' | 'limited' | 'sold-out';
  accent: string;
  includes: string[];
  hostMessage: string;
  published?: boolean;
  depositAmount?: number;
  depositCurrency?: 'MXN' | 'USD';
  paypalUrl?: string;
};

export const COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    slug: 'club-de-vinilos-la-perla',
    title: 'Club de vinilos: escuchar el disco completo',
    kicker: 'BRUUK PLAN / 001',
    summary: 'Una escucha colectiva para volver a poner atención, lado A y lado B.',
    description:
      'La Perla abre sus puertas para una sesión de escucha sin saltar pistas. Elegimos un disco, compartimos contexto y dejamos que la conversación aparezca después de la última canción.',
    date: '2026-08-22T18:00:00-06:00',
    dateLabel: 'SÁBADO 22 AGO',
    timeLabel: '18:00 — 20:00',
    venue: 'La Perla Records & Books',
    neighborhood: 'Americana · Guadalajara',
    address: 'Guadalajara, Jalisco',
    mapsUrl: 'https://maps.app.goo.gl/wf8RY3hPstB7146e6',
    image: '/img/spots/34-la-perla-records-books.jpg',
    imageAlt: 'Interior de La Perla Records & Books',
    capacity: 24,
    priceLabel: 'ANTICIPO $150 MXN · PAYPAL',
    status: 'open',
    accent: '#a78bfa',
    includes: ['Sesión guiada', 'Conversación abierta', 'Selección de vinilos', 'Bebida de bienvenida'],
    hostMessage: 'Comparte este enlace con tu comunidad para registrar asistentes sin cuentas ni contraseñas.',
    depositAmount: 150,
    depositCurrency: 'MXN',
    paypalUrl: '',
  },
  {
    slug: 'intercambio-vintage-bad-people',
    title: 'Intercambio vintage: una pieza entra, otra sale',
    kicker: 'BRUUK PLAN / 002',
    summary: 'Trae una pieza que ya cumplió su ciclo y encuentra la siguiente.',
    description:
      'Una tarde para intercambiar ropa, conocer a quienes buscan distinto y extender la vida de cada prenda. Bad People recibe la comunidad y Bruuk organiza la dinámica.',
    date: '2026-08-29T17:00:00-06:00',
    dateLabel: 'SÁBADO 29 AGO',
    timeLabel: '17:00 — 20:00',
    venue: 'Bad people Gdl Vintage Store',
    neighborhood: 'Americana · Guadalajara',
    address: 'Guadalajara, Jalisco',
    mapsUrl: 'https://maps.app.goo.gl/jmhAX51RtUXMQkGD7',
    image: '/img/spots/01-bad-people-gdl-vintage-store.jpg',
    imageAlt: 'Fachada de Bad People GDL Vintage Store',
    capacity: 36,
    priceLabel: 'ANTICIPO $100 MXN · PAYPAL',
    status: 'limited',
    accent: '#64d23c',
    includes: ['Mesa de intercambio', 'Curaduría de piezas', 'DJ set', 'Beneficio especial en tienda'],
    hostMessage: 'Este link funciona como invitación y registro público para el evento.',
    depositAmount: 100,
    depositCurrency: 'MXN',
    paypalUrl: '',
  },
  {
    slug: 'ruta-tianguis-cultural',
    title: 'Ruta Tianguis Cultural: caminar para encontrar',
    kicker: 'BRUUK PLAN / 003',
    summary: 'Un recorrido pequeño para mirar el tianguis con otros ojos.',
    description:
      'Nos encontramos, recorremos puestos seleccionados y cerramos con una conversación sobre cultura callejera, intercambio y las historias que sostienen al tianguis.',
    date: '2026-09-05T10:00:00-06:00',
    dateLabel: 'SÁBADO 05 SEP',
    timeLabel: '10:00 — 12:30',
    venue: 'Tianguis Cultural',
    neighborhood: 'Centro · Guadalajara',
    address: 'Guadalajara, Jalisco',
    mapsUrl: 'https://maps.app.goo.gl/AdbJx4gTpcHKvAfJ9',
    image: '/img/tianguis/cultural.jpg',
    imageAlt: 'Puestos y visitantes del Tianguis Cultural de Guadalajara',
    capacity: 18,
    priceLabel: 'ANTICIPO $80 MXN · PAYPAL',
    status: 'limited',
    accent: '#e8a145',
    includes: ['Punto de encuentro', 'Ruta guiada', 'Paradas seleccionadas', 'Cierre en comunidad'],
    hostMessage: 'Comparte la URL para reunir al grupo y recibir sus registros.',
    depositAmount: 80,
    depositCurrency: 'MXN',
    paypalUrl: '',
  },
];

const STORAGE_KEY = 'bruuk-community-events-v1';

const isCommunityEvent = (value: unknown): value is CommunityEvent => {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<CommunityEvent>;
  return typeof event.slug === 'string' && typeof event.title === 'string' && typeof event.venue === 'string';
};

export const getManagedEvents = (): CommunityEvent[] => {
  if (typeof window === 'undefined') return COMMUNITY_EVENTS;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return COMMUNITY_EVENTS;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isCommunityEvent)) return COMMUNITY_EVENTS;
    return parsed.map((event) => ({
      ...COMMUNITY_EVENTS.find((defaultEvent) => defaultEvent.slug === event.slug),
      ...event,
    }));
  } catch {
    return COMMUNITY_EVENTS;
  }
};

export const saveManagedEvents = (events: CommunityEvent[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent('bruuk-events-updated'));
};

export const resetManagedEvents = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('bruuk-events-updated'));
};

export const getCommunityEvent = (slug?: string) =>
  getManagedEvents().find((event) => event.slug === slug && event.published !== false);

export const getPaypalDepositUrl = (event: CommunityEvent) => {
  const baseUrl = event.paypalUrl?.trim();
  const amount = event.depositAmount ?? 0;
  if (!baseUrl || amount <= 0) return '';
  if (!baseUrl.toLowerCase().includes('paypal.me/')) return baseUrl;
  return `${baseUrl.replace(/\/$/, '')}/${amount}${event.depositCurrency ?? 'MXN'}`;
};
