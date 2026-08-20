import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dataPath = resolve(root, 'src/data/spots.json');
const outputDir = resolve(root, 'public/img/spots-real');
const manifestPath = resolve(root, 'scripts/spot-image-sources.json');
const args = new Set(process.argv.slice(2));
const applyChanges = args.has('--apply');
const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='));
const offsetArgument = process.argv.find((argument) => argument.startsWith('--offset='));
const idsArgument = process.argv.find((argument) => argument.startsWith('--ids='));
const limit = limitArgument ? Number(limitArgument.split('=')[1]) : Number.POSITIVE_INFINITY;
const offset = offsetArgument ? Number(offsetArgument.split('=')[1]) : 0;
const requestedIds = idsArgument ? new Set(idsArgument.split('=')[1].split(',')) : null;

const excludedHosts = [
  'unsplash.com',
  'pinterest.',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'x.com',
  'twitter.com',
];

const preferredHosts = [
  'restaurantguru.',
  'tripadvisor.',
  'mapquest.',
  'mindtrip.ai',
  'foursquare.',
];

const curatedSources = {
  spot_003: {
    sourcePage: 'https://www.haninsinmun.com/single-post/%EC%84%B8%EA%B3%84-%EC%B5%9C%EA%B3%A0-%EC%BB%A4%ED%94%BC%EC%88%8D%EC%97%90-%EC%9D%B4%EB%A6%84-%EC%98%AC%EB%A6%B0-%EB%A9%95%EC%8B%9C%EC%BD%94-%EC%B9%B4%ED%8E%98-3%EA%B3%B3%EC%9D%80-%EC%96%B4%EB%94%94',
    imageUrl: 'https://static.wixstatic.com/media/92f6be_ef4b6d705bcd4124adcf92b6efa1f075~mv2.jpg/v1/fill/w_980%2Ch_980%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/92f6be_ef4b6d705bcd4124adcf92b6efa1f075~mv2.jpg',
  },
  spot_004: {
    sourcePage: 'https://es.restaurantguru.com/Tenango-Mexico-Guadalajara',
    imageUrl: 'https://img02.restaurantguru.com/caf2-Restaurant-Cafe-Tenango-meals.jpg',
  },
  spot_010: {
    sourcePage: 'https://es.restaurantguru.com/KAFEI-Guadalajara',
    imageUrl: 'https://img02.restaurantguru.com/cce3-KAFEI-Guadalajara-food.jpg',
  },
  spot_014: {
    sourcePage: 'https://www.opentable.com.mx/r/roto-cafe-and-vino-guadalajara',
    imageUrl: 'https://resizer.otstatic.com/v2/photos/xlarge/1/92062418.jpg',
  },
  spot_018: {
    sourcePage: 'https://mexicorutamagica.mx/2024/01/29/donde-comer-croissants-en-guadalajara-panaderias-jalisco-mexico/',
    imageUrl: 'https://mexicorutamagica.mx/wp-content/uploads/2024/01/croissants-en-guadalajara-karmele-fachada-768x960.jpg',
  },
  spot_026: {
    sourcePage: 'https://es.restaurantguru.com/Toyo-Guadalajara',
    imageUrl: 'https://img02.restaurantguru.com/ca67-Restaurante-Toyo-Guadalajara-interior.jpg',
  },
  spot_105: {
    sourcePage: 'https://www.minube.com/rincon/restaurante-palreal-a3626630',
    imageUrl: 'https://images.mnstatic.com/c1/e6/c1e637d1f32ad0e69792bf4ca0015b3d.jpg',
  },
  spot_109: {
    sourcePage: 'https://es.restaurantguru.com/Louie-Burger-Guadalajara',
    imageUrl: 'https://img02.restaurantguru.com/c5c1-Restaurant-Louie-Burger-Americana-dishes-1.jpg',
  },
  spot_111: {
    sourcePage: 'https://www.happycow.net/reviews/archipielago-pizza-guadalajara-305905',
    imageUrl: 'https://images.happycow.net/venues/1024/30/59/hcmp305905_2254708.jpeg',
  },
  spot_116: {
    sourcePage: 'https://www.radioformula.com.mx/estilodevida/El-restaurante-en-Guadalajara-que-te-hara-sentir-en-Japon-20230927-0073.html',
    imageUrl: 'https://www.radioformula.com.mx/img/2023/01/01/20250726_050118283_El_restaurante_en_Guadalajara_que_te_harx_sentir_en_Japxn.jpg?__scale=c%3Atransparent%2Cw%3A600%2Ch%3A737%2Ct%3A3',
  },
  spot_131: {
    sourcePage: 'https://mixmaglatam.com/read/bar-americas-gdl',
    imageUrl: 'https://mixmaglatinamerica.com/assets/uploads/images/_twoThirds/BA2.jpeg',
  },
};

const existingLocalPhotos = {
  spot_106: {
    localFile: '/img/spots/42-jamaica-records.jpg',
    sourcePage: 'https://www.google.com/maps/search/?api=1&query=Jamaica%20Records%2C%20Guadalajara%2C%20Jalisco',
  },
};

const forceIllustrations = new Set([
  'spot_004', 'spot_010', 'spot_026', 'spot_035', 'spot_040', 'spot_109',
]);

const genericNameWords = new Set([
  'cafe', 'cafeteria', 'rest', 'restaurante', 'bar', 'club', 'cocina', 'bakery',
  'pizza', 'pizzeria', 'ramen', 'house', 'rooftop', 'gdl', 'guadalajara', 'the',
]);

const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return decodeURIComponent(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function distinctiveTokens(name) {
  return normalizeText(name)
    .split(' ')
    .filter((token) => token.length >= 4 && !genericNameWords.has(token));
}

function candidateScore(candidate, name) {
  const imageHost = new URL(candidate.imageUrl).hostname.toLowerCase();
  const sourceHost = new URL(candidate.sourcePage).hostname.toLowerCase();
  if (excludedHosts.some((excluded) => imageHost.includes(excluded) || sourceHost.includes(excluded))) return -100;
  const sourceText = normalizeText(candidate.sourcePage);
  const tokens = distinctiveTokens(name);
  const tokenMatches = tokens.filter((token) => sourceText.includes(token)).length;
  const requiredMatches = Math.min(tokens.length, 2);
  if (tokenMatches < requiredMatches) return -100;
  const preferred = preferredHosts.some((preferredHost) => sourceHost.includes(preferredHost));
  const likelyImage = /\.(?:jpe?g|png|webp)(?:$|\?)/i.test(candidate.imageUrl);
  return tokenMatches * 25 + (preferred ? 20 : 0) + (likelyImage ? 5 : 0);
}

async function queryCandidates(queryText) {
  const query = encodeURIComponent(queryText);
  const response = await fetch(`https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`, {
    headers: {
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Búsqueda HTTP ${response.status}`);
  const html = await response.text();
  const candidates = [];
  const pattern = /class="iusc"[^>]+\sm="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) && candidates.length < 30) {
    try {
      const metadata = JSON.parse(decodeHtml(match[1]));
      const imageUrl = safeUrl(metadata.murl);
      const sourcePage = safeUrl(metadata.purl);
      if (!imageUrl || !sourcePage) continue;
      candidates.push({ imageUrl: imageUrl.toString(), sourcePage: sourcePage.toString() });
    } catch {
      // Bing can include non-JSON tracking cards among image results.
    }
  }

  return candidates;
}

async function findCandidates(name) {
  const searches = [
    `"${name}" Guadalajara site:restaurantguru.com`,
    `"${name}" Guadalajara site:tripadvisor.com`,
    `"${name}" Guadalajara Jalisco fachada interior`,
  ];

  for (const search of searches) {
    const candidates = (await queryCandidates(search))
      .filter((candidate) => candidateScore(candidate, name) >= 0)
      .sort((first, second) => candidateScore(second, name) - candidateScore(first, name));
    if (candidates.length) return candidates;
  }

  return [];
}

function extensionFor(contentType, url) {
  if (contentType.includes('image/jpeg')) return '.jpg';
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/webp')) return '.webp';
  if (contentType.includes('image/avif')) return '.avif';
  const extension = extname(new URL(url).pathname).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extension) ? extension : null;
}

async function downloadCandidate(candidate, id) {
  const response = await fetch(candidate.imageUrl, {
    headers: {
      Referer: candidate.sourcePage,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(18_000),
  });
  if (!response.ok) throw new Error(`Imagen HTTP ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const extension = extensionFor(contentType, candidate.imageUrl);
  if (!extension || (!contentType.startsWith('image/') && !/\.(jpe?g|png|webp|avif)$/i.test(extension))) {
    throw new Error('El recurso no es una imagen compatible');
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 18_000 || bytes.byteLength > 6_000_000) throw new Error('Tamaño de imagen no aceptado');
  const fileName = `${id}${extension === '.jpeg' ? '.jpg' : extension}`;
  await writeFile(resolve(outputDir, fileName), bytes);
  return { fileName, bytes: bytes.byteLength };
}

function illustrationFor(spot) {
  const initials = spot.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const label = spot.type.toUpperCase().slice(0, 26);
  const name = spot.name.toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" role="img" aria-labelledby="title description">
  <title id="title">Ilustración editorial de ${xml(spot.name)}</title>
  <description id="description">Visual geométrico tipo Rack creado por Bruuk porque no hay una fotografía verificada.</description>
  <defs><pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#0a0911" stroke-opacity=".17" stroke-width="2"/></pattern></defs>
  <rect width="900" height="1100" fill="#8b7cf6"/><rect width="900" height="1100" fill="url(#grid)"/>
  <circle cx="760" cy="865" r="245" fill="none" stroke="#0a0911" stroke-opacity=".16" stroke-width="76"/>
  <path d="M72 112h756M72 988h756" stroke="#0a0911" stroke-width="4"/>
  <text x="72" y="82" fill="#0a0911" font-family="Arial,Helvetica,sans-serif" font-size="25" font-weight="800" letter-spacing="5">/ BRUUK · ILUSTRACIÓN</text>
  <text x="450" y="590" text-anchor="middle" fill="#0a0911" font-family="Arial Black,Arial,sans-serif" font-size="330" font-weight="900" letter-spacing="-28">${xml(initials)}</text>
  <text x="72" y="930" fill="#0a0911" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="800" letter-spacing="4">${xml(label)}</text>
  <text x="72" y="1036" fill="#0a0911" font-family="Arial Black,Arial,sans-serif" font-size="42" font-weight="900">${xml(name.slice(0, 31))}</text>
  <text x="824" y="82" text-anchor="end" fill="#0a0911" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="800">GDL / 2026</text>
</svg>`;
}

const spots = JSON.parse(await readFile(dataPath, 'utf8'));
const previousManifest = await readFile(manifestPath, 'utf8').then(JSON.parse).catch(() => ({}));
const manifest = { ...previousManifest };
const selected = requestedIds
  ? spots.filter((spot) => requestedIds.has(spot.id))
  : spots.slice(offset, offset + limit);
await mkdir(outputDir, { recursive: true });

for (const [index, spot] of selected.entries()) {
  const catalogIndex = spots.findIndex((candidate) => candidate.id === spot.id) + 1;
  process.stdout.write(`[${catalogIndex}/${spots.length}] ${spot.name}: `);
  const existingPhoto = existingLocalPhotos[spot.id];
  if (existingPhoto) {
    spot.imageUrl = existingPhoto.localFile;
    manifest[spot.id] = {
      name: spot.name,
      kind: 'existing-local-photo',
      sourcePage: existingPhoto.sourcePage,
      localFile: spot.imageUrl,
      reviewed: true,
    };
    process.stdout.write('foto local verificada\n');
    await sleep(40);
    continue;
  }

  let selectedImage = null;
  try {
    const candidates = forceIllustrations.has(spot.id)
      ? []
      : curatedSources[spot.id]
      ? [curatedSources[spot.id]]
      : await findCandidates(spot.name);
    for (const candidate of candidates.slice(0, 12)) {
      try {
        const downloaded = await downloadCandidate(candidate, spot.id);
        selectedImage = { ...candidate, ...downloaded };
        break;
      } catch {
        // Try the next candidate when a host blocks hotlinking or serves a thumbnail.
      }
    }
  } catch (error) {
    process.stdout.write(`búsqueda falló (${error.message}); `);
  }

  if (selectedImage) {
    spot.imageUrl = `/img/spots-real/${selectedImage.fileName}`;
    manifest[spot.id] = {
      name: spot.name,
      kind: 'scraped-photo',
      sourcePage: selectedImage.sourcePage,
      sourceImage: selectedImage.imageUrl,
      localFile: spot.imageUrl,
      reviewed: Boolean(curatedSources[spot.id]),
    };
    process.stdout.write(`foto ${selectedImage.bytes} bytes\n`);
  } else {
    const fileName = `${spot.id}.svg`;
    await writeFile(resolve(outputDir, fileName), illustrationFor(spot), 'utf8');
    spot.imageUrl = `/img/spots-real/${fileName}`;
    manifest[spot.id] = {
      name: spot.name,
      kind: 'rack-illustration',
      localFile: spot.imageUrl,
      reviewed: true,
    };
    process.stdout.write('ilustración Rack\n');
  }

  await sleep(420);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
if (applyChanges) {
  await writeFile(dataPath, `${JSON.stringify(spots, null, 2)}\n`, 'utf8');
  console.log(`Actualizados ${selected.length} spots y su manifiesto de fuentes.`);
} else {
  console.log('Vista previa completada. Usa --apply para actualizar spots.json.');
}
