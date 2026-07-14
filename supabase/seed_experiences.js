import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para leer archivo .env manualmente
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('No se encontró el archivo .env en la raíz del proyecto.');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder')) {
  console.warn('⚠️  Usa credenciales reales en tu archivo .env para poder sembrar la base de datos.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPERIENCES = [
  {
    id: 'exp_001',
    name: 'Cata de Mezcales Ancestrales',
    host_name: 'Mateo Silva',
    host_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    category: 'Gastronomía',
    image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80',
    rating: 4.9,
    reviews_count: 24,
    price: '$450 MXN',
    duration: '2.5 horas',
    location: 'Colonia Americana',
    city: 'guadalajara',
    description: 'Aprende a degustar mezcal artesanal y ancestral maridado con chocolate y frutas en un patio secreto.',
    long_description: 'Te abriremos las puertas de un patio colonial escondido en la Colonia Americana. Probaremos 4 variedades de mezcales de pequeños productores de Oaxaca y Jalisco, y aprenderemos sobre los procesos de destilación en ollas de barro y cobre. Cada mezcal irá acompañado de un bocado diseñado para resaltar sus notas de humo, tierra y agave.',
    whatsapp_link: 'https://wa.me/523300000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20la%20Cata%20de%20Mezcales%20Ancestrales.',
    images: [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80',
      'https://images.unsplash.com/photo-1629168925203-8d26bb87d00f?w=500&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80'
    ],
    reservation_info: 'Reserva pagando el 50% por transferencia. El lugar exacto se compartirá 24h antes del evento.',
    status: 'approved'
  },
  {
    id: 'exp_002',
    name: 'Taller de Barro Negro Oaxaqueño',
    host_name: 'Carmen Mendoza',
    host_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    category: 'Arte',
    image_url: 'https://images.unsplash.com/photo-1565192647048-f997ded87920?w=500&q=80',
    rating: 5.0,
    reviews_count: 18,
    price: '$380 MXN',
    duration: '3 horas',
    location: 'Tlaquepaque Centro',
    city: 'guadalajara',
    description: 'Moldea tu propia pieza en torno tradicional de pedal guiado por una artesana oaxaqueña.',
    long_description: 'Una experiencia práctica e íntima. Carmen, artesana de cuarta generación de barro negro, te enseñará las técnicas básicas de amasado, centrado en el torno tradicional de pedal y el posterior bruñido con cuarzo para darle ese brillo negro metálico tan característico. Te llevarás la pieza que moldees en el taller.',
    whatsapp_link: 'https://wa.me/523300000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20el%20Taller%20de%20Barro%20Negro.',
    images: [
      'https://images.unsplash.com/photo-1565192647048-f997ded87920?w=500&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80'
    ],
    reservation_info: 'Reserva directa por WhatsApp. Se aparta con $150 MXN. Incluye materiales y tu pieza horneada.',
    status: 'approved'
  },
  {
    id: 'exp_003',
    name: 'Fotos en Azoteas y Techos Urbanos',
    host_name: 'Diego Morales',
    host_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    category: 'Aventura',
    image_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&q=80',
    rating: 4.8,
    reviews_count: 32,
    price: '$300 MXN',
    duration: '2 horas',
    location: 'Colonia Centenario',
    city: 'hermosillo',
    description: 'Consigue perspectivas fotográficas espectaculares explorando azoteas escondidas del centro.',
    long_description: 'Subiremos a tres techos con acceso controlado que ofrecen las mejores vistas panorámicas y atardeceres de Hermosillo. Ideal tanto para fotógrafos con cámara profesional como para quienes quieran tomar fotos increíbles con su celular. Te daré tips de composición, iluminación urbana y retrato al atardecer.',
    whatsapp_link: 'https://wa.me/526620000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20la%20Sesión%20de%20Fotos%20en%20Azoteas.',
    images: [
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&q=80',
      'https://images.unsplash.com/photo-1517409240409-df6322987a02?w=500&q=80',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&q=80'
    ],
    reservation_info: 'Máximo 6 personas. Cupo se reserva pagando el total por transferencia.',
    status: 'approved'
  },
  {
    id: 'exp_004',
    name: 'Senderismo Nocturno en la Barranca',
    host_name: 'Sofía Ruiz',
    host_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    category: 'Aventura',
    image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&q=80',
    rating: 4.9,
    reviews_count: 15,
    price: '$350 MXN',
    duration: '4 horas',
    location: 'Barranca de Huentitán',
    city: 'guadalajara',
    description: 'Camina por senderos iluminados por la luna llena hasta un mirador natural de la barranca.',
    long_description: 'Una desconexión total de la ciudad. Haremos un descenso controlado por senderos no turísticos de la Barranca de Huentitán durante las horas frescas de la noche. Usaremos lámparas frontales y disfrutaremos del silencio natural y la vista del río Santiago iluminado por la luna llena. Incluye snacks energéticos e hidratación.',
    whatsapp_link: 'https://wa.me/523300000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20el%20Senderismo%20Nocturno.',
    images: [
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80'
    ],
    reservation_info: 'Se requiere calzado de montaña. Se aparta lugar pagando el costo total.',
    status: 'approved'
  },
  {
    id: 'exp_005',
    name: 'Acústico Secreto en Sótano de Jazz',
    host_name: 'Rodrigo Peña',
    host_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    category: 'Música',
    image_url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&q=80',
    rating: 4.9,
    reviews_count: 20,
    price: '$250 MXN',
    duration: '2 horas',
    location: 'Centro Histórico',
    city: 'hermosillo',
    description: 'Un concierto acústico exclusivo de jazz y folk para solo 15 personas en un sótano secreto.',
    long_description: 'Baja cuatro escalones y entra a un sótano de ladrillo expuesto donde el sonido rebota de forma perfecta. Disfrutarás de un set íntimo de 2 horas con tres músicos independientes locales. Una experiencia pensada para escuchar música con atención plena, tomar una copa de vino y charlar en un ambiente cercano y relajado.',
    whatsapp_link: 'https://wa.me/526620000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20el%20Acústico%20Secreto.',
    images: [
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&q=80',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80'
    ],
    reservation_info: 'Boletos físicos disponibles. Transferencia para asegurar tu lugar. BYOB permitido.',
    status: 'approved'
  }
];

// Helper to get next saturday at 10 AM (for dummy events)
function getNextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

const EVENTS = EXPERIENCES.map((exp, index) => ({
  id: `event_00${index + 1}`,
  experience_id: exp.id,
  date: getNextSaturday(),
  location: exp.location,
  capacity: 15
}));

async function seed() {
  console.log('Sembrando experiencias...');
  const { error: expError } = await supabase
    .from('experiences')
    .upsert(EXPERIENCES, { onConflict: 'id' });

  if (expError) {
    console.error('Error insertando experiencias:', expError.message);
    process.exit(1);
  }

  console.log('Sembrando eventos...');
  const { error: evError } = await supabase
    .from('events')
    .upsert(EVENTS, { onConflict: 'id' });

  if (evError) {
    console.error('Error insertando eventos:', evError.message);
    process.exit(1);
  }

  console.log('✅ Base de datos sembrada con éxito con experiencias y eventos.');
}

seed().catch(err => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});
