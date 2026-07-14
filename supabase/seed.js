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

async function seed() {
  console.log('Cargando spots de src/data/spots.json...');
  const spotsPath = path.resolve(__dirname, '../src/data/spots.json');
  const spots = JSON.parse(fs.readFileSync(spotsPath, 'utf8'));

  console.log(`Encontrados ${spots.length} spots. Subiendo a Supabase...`);

  const dbRows = spots.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    description: s.description,
    image_url: s.imageUrl,
    color_accent: s.colorAccent,
    rating: s.rating,
    price: s.price,
    lat: s.coordinates?.lat || null,
    lng: s.coordinates?.lng || null,
    maps_link: s.mapsLink,
    city: s.city
  }));

  // Inserta los spots en batches de 50 para evitar límites
  const batchSize = 50;
  for (let i = 0; i < dbRows.length; i += batchSize) {
    const batch = dbRows.slice(i, i + batchSize);
    console.log(`Insertando batch ${i / batchSize + 1} (${batch.length} registros)...`);
    const { error } = await supabase
      .from('spots')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error('Error al insertar batch:', error.message);
      process.exit(1);
    }
  }

  console.log('✅ Base de datos sembrada con éxito en Supabase.');
}

seed().catch(err => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});
