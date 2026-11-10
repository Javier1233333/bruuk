import type { Itinerary } from '../lib/itinerary';

// Rutas curadas por Bruuk: paradas reales de la guía, en un orden que se puede
// caminar. Cada parada es el id de un spot o lugar de Rack; nombre, tipo y
// "VE POR" salen del catálogo. Si un lugar se da de baja, la parada se omite.
export const CURATED_ROUTES: Itinerary[] = [
  {
    id: 'manana-cafe-vintage',
    title: 'Mañana de café + vintage',
    blurb: 'Desayuno entre plantas, percheros a unos pasos y comida sin moverte de la colonia.',
    vibes: ['Solo', 'Amigos'],
    moment: 'manana',
    source: 'curada',
    stops: [
      { placeId: 'spot_041', time: '10:00' },
      { placeId: 'rack_lavanda-vintage', time: '11:30' },
      { placeId: 'rack_bad-people-gdl-vintage-store', time: '12:15' },
      { placeId: 'spot_035', time: '13:30' },
    ],
  },
  {
    id: 'tarde-vinilos-vino',
    title: 'Tarde de vinilos y vino',
    blurb: 'Dos tiendas de discos casi puerta con puerta y una terraza para comentar lo que encontraron.',
    vibes: ['Cita', 'Solo'],
    moment: 'tarde',
    source: 'curada',
    stops: [
      { placeId: 'rack_la-perla-records-books', time: '16:30' },
      { placeId: 'rack_velvet-records-gdl', time: '17:30' },
      { placeId: 'spot_014', time: '18:30' },
    ],
  },
  {
    id: 'centro-patio-libros',
    title: 'Centro: patio, libros viejos y café',
    blurb: 'Un patio que baja el volumen, una librería para buscar sin prisa y café de regreso hacia la Americana.',
    vibes: ['Solo', 'Cita'],
    moment: 'tarde',
    source: 'curada',
    stops: [
      { placeId: 'rack_ex-convento-del-carmen', time: '16:00' },
      { placeId: 'rack_libreria-de-usado-y-antiguo-el-desvan-de-don-quijote', time: '17:15' },
      { placeId: 'spot_047', time: '18:15' },
    ],
  },
  {
    id: 'santa-tere-barrio',
    title: 'Santa Tere a pie',
    blurb: 'Café en una casa con terraza, vinilos de barrio y ramen sin protocolo.',
    vibes: ['Amigos', 'Solo'],
    moment: 'manana',
    source: 'curada',
    stops: [
      { placeId: 'spot_004', time: '10:30' },
      { placeId: 'rack_tea-recs', time: '12:00' },
      { placeId: 'spot_026', time: '13:30' },
    ],
  },
  {
    id: 'noche-americana-santa-tere',
    title: 'Noche de la Americana a Santa Tere',
    blurb: 'Cena casual y dos barras para alargar la noche caminando.',
    vibes: ['Amigos', 'Cita'],
    moment: 'noche',
    source: 'curada',
    stops: [
      { placeId: 'spot_024', time: '19:30' },
      { placeId: 'spot_043', time: '21:00' },
      { placeId: 'spot_042', time: '22:30' },
    ],
  },
];
