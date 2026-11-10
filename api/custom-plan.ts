import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  INTEREST_OPTIONS,
  MOMENT_INTERESTS,
  MOMENT_OPTIONS,
  ROULETTE_MOMENTS,
  ROULETTE_ZONES,
  VIBE_OPTIONS,
  labelFor,
  parsePlanChoices,
  parseRouletteRequest,
  type CustomPlan,
  type PlanChoices,
  type PlanPlace,
  type PlanStop,
  type RouletteRequest,
} from '../src/data/planBuilder.js';
import { findPlace, getLiveCatalog, type LiveCatalog } from './_catalog.js';
import { firebaseConfigured, verifyAuthHeader } from './_firebase.js';
import { clientIp, takeSlot } from './_security.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
// Pocos lugares por llamada: el catálogo es casi todo el costo en tokens.
const MAX_PLACES_PER_INTEREST = 12;
const MAX_ROULETTE_BACKUPS = 12;
const MAX_INFO_LENGTH = 140;
// Cada llamada cuesta tokens de DeepSeek y el endpoint no pide sesión:
// límite por persona (por cuenta si manda su token, si no por IP) y un tope global diario.
// La app nativa manda el token: en datos móviles mucha gente comparte la misma IP.
const MAX_PER_IP = 30;
const IP_WINDOW_MS = 60 * 60 * 1000;
const MAX_GLOBAL_PER_DAY = Number(process.env.CUSTOM_PLAN_DAILY_LIMIT) || 1500;
const DAY_MS = 24 * 60 * 60 * 1000;

// 'ok' si quedan llamadas; si no, el motivo para responder 429
async function takePlanSlot(request: VercelRequest): Promise<'ok' | 'ip' | 'global'> {
  // Sin Firestore (dev local) no hay dónde contar
  if (!firebaseConfigured) return 'ok';
  const user = await verifyAuthHeader(request.headers.authorization);
  const allowed = user
    ? await takeSlot('customPlanUsers', user.uid, MAX_PER_IP, IP_WINDOW_MS)
    : await takeSlot('customPlanIps', clientIp(request), MAX_PER_IP, IP_WINDOW_MS);
  if (!allowed) return 'ip';
  if (!(await takeSlot('customPlanGlobal', 'all', MAX_GLOBAL_PER_DAY, DAY_MS))) return 'global';
  return 'ok';
}

const clean = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

class UpstreamError extends Error {}

const askDeepSeek = async (system: string, user: string, maxTokens: number, temperature: number) => {
  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!response.ok) {
    console.error('DeepSeek error:', response.status, await response.text());
    throw new UpstreamError(`DeepSeek ${response.status}`);
  }
  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;
  try {
    return typeof content === 'string' ? (JSON.parse(content) as Record<string, unknown>) : null;
  } catch {
    console.error('DeepSeek returned invalid JSON:', content);
    return null;
  }
};

const catalogFor = (catalog: LiveCatalog, choices: PlanChoices, exclude: Set<string> = new Set()) =>
  choices.interests.flatMap((interest) =>
    shuffle(catalog.places.filter((place) => place.interest === interest && !exclude.has(place.id))).slice(0, MAX_PLACES_PER_INTEREST),
  );

const ZONE_LABEL = Object.fromEntries(ROULETTE_ZONES.map((zone) => [zone.value, zone.label]));

// Una línea corta por lugar: "n|nombre|tipo|precio|zona|qué es". El modelo responde con n, no con ids largos.
const catalogLine = (place: PlanPlace, n: number, fixed = false) =>
  [
    `${fixed ? '*' : ''}${n}`,
    place.name,
    place.type,
    place.price ?? '',
    place.zone ? ZONE_LABEL[place.zone] : '',
    clean(place.tip || place.description, MAX_INFO_LENGTH),
  ].join('|');

// Numera los lugares para el prompt y traduce de vuelta lo que conteste el modelo.
const numbered = (places: PlanPlace[]) => {
  const list = [...new Map(places.map((place) => [place.id, place])).values()];
  return {
    list,
    text: (fixed: Set<string> = new Set()) => list.map((place, index) => catalogLine(place, index + 1, fixed.has(place.id))).join('\n'),
    idOf: (value: unknown) => list[Number(value) - 1]?.id ?? '',
  };
};

const choicesText = (choices: PlanChoices) =>
  [
    `- Momento: ${labelFor(MOMENT_OPTIONS, choices.moment)}`,
    `- Con quién: ${labelFor(COMPANY_OPTIONS, choices.company)}`,
    `- Le interesa: ${choices.interests.map((interest) => labelFor(INTEREST_OPTIONS, interest)).join(', ')}`,
    `- Ritmo: ${labelFor(VIBE_OPTIONS, choices.vibe)}`,
    `- Presupuesto por persona: ${BUDGET_OPTIONS.find((option) => option.value === choices.budget)?.hint}`,
    choices.note ? `- Petición extra de la persona (tómala en cuenta sólo si es sobre el plan): "${choices.note}"` : '',
  ]
    .filter(Boolean)
    .join('\n');

// Corto a propósito: va en cada llamada. El estilo Bruuk en pocas reglas.
const BASE_RULES = [
  'Eres el editor de Bruuk, guía de Guadalajara hecha por personas. Lema: menos pantalla, más mundo.',
  'Usa SÓLO lugares de la lista, citándolos por su número n. No inventes nada: todo lo que digas de un lugar sale de su línea.',
  'Español de México, directo y cercano. Sin emojis ni frases de folleto.',
  'Ordena por hora (desayuno, comida, atardecer ~19:00, bares de noche) y pon seguidas las paradas de la misma zona.',
  'Si la línea dice días u horarios, respétalos y dilo en "why".',
].join('\n');

const PLAN_PROMPT = `${BASE_RULES}
Responde sólo JSON: {"title":"máx 6 palabras","intro":"1 frase","stops":[{"n":1,"time":"10:00","why":"1 frase"}],"closing":"1 frase"}`;

const ROULETTE_PROMPT = `${BASE_RULES}
Las paradas las eligió una ruleta. Encuentra el hilo que las une (un antojo, una zona, una forma de pasar el día) y ordénalas.
Usa las que salieron. Sólo si una sin * de plano no cabe (bar en la mañana, tianguis cerrado, otra punta de la ciudad), cámbiala por una de "apoyo". Las de * nunca se cambian.
Responde sólo JSON: {"title":"máx 6 palabras","thread":"1 frase","intro":"1 frase","stops":[{"n":1,"time":"10:00","why":"1 frase"}],"closing":"1 frase"}`;

const toStop = (value: unknown, idOf: (n: unknown) => string): PlanStop => {
  const stop = (value ?? {}) as Record<string, unknown>;
  return { placeId: idOf(stop.n), time: clean(stop.time, 20), why: clean(stop.why, 300) };
};

const generatePlan = async (live: LiveCatalog, choices: PlanChoices): Promise<CustomPlan | null> => {
  const catalog = numbered(catalogFor(live, choices));
  const user = [
    'Opciones elegidas:',
    choicesText(choices),
    `- Paradas: exactamente ${choices.stops}, sin repetir, cubriendo los intereses.`,
    '',
    'Lista (n|nombre|tipo|precio|zona|qué es):',
    catalog.text(),
  ].join('\n');
  const raw = await askDeepSeek(PLAN_PROMPT, user, 600, 1.1);
  if (!raw) return null;

  const seen = new Set<string>();
  const stops = (Array.isArray(raw.stops) ? raw.stops : [])
    .map((stop) => toStop(stop, catalog.idOf))
    .filter((stop) => {
      if (!findPlace(live, stop.placeId) || seen.has(stop.placeId)) return false;
      seen.add(stop.placeId);
      return true;
    })
    .slice(0, choices.stops);
  if (stops.length === 0) return null;

  return {
    title: clean(raw.title, 80) || 'Tu plan en Guadalajara',
    intro: clean(raw.intro, 400),
    stops,
    closing: clean(raw.closing, 300),
  };
};

// Cambia una sola parada y deja el resto del plan como está.
const swapStop = async (live: LiveCatalog, choices: PlanChoices, planPlaceIds: string[], swapIndex: number): Promise<PlanStop | null> => {
  const current = findPlace(live, planPlaceIds[swapIndex])!;
  const exclude = new Set(planPlaceIds);
  const catalog = numbered(catalogFor(live, choices, exclude));
  const user = [
    'Opciones elegidas:',
    choicesText(choices),
    '',
    'Plan actual, en orden:',
    ...planPlaceIds.map((id, index) => `${index + 1}. ${findPlace(live, id)!.name}${index === swapIndex ? '  <- REEMPLAZAR' : ''}`),
    '',
    `Cambia "${current.name}" por otro lugar que encaje en esa posición. Devuelve sólo esa parada en "stops".`,
    '',
    'Lista (n|nombre|tipo|precio|zona|qué es):',
    catalog.text(),
  ].join('\n');
  const raw = await askDeepSeek(PLAN_PROMPT, user, 250, 1.1);
  const stop = toStop(Array.isArray(raw?.stops) ? raw.stops[0] : null, catalog.idOf);
  if (!findPlace(live, stop.placeId) || exclude.has(stop.placeId)) return null;
  return stop;
};

// Ruleta: respeta las paradas que salieron y deja que la IA cambie sólo las que no encajan.
const generateRoulettePlan = async (live: LiveCatalog, { placeIds, locked, moment, zone }: RouletteRequest): Promise<CustomPlan | null> => {
  const spun = new Set(placeIds);
  // Reemplazos sólo de la misma zona que lo que salió, para que el cambio no rompa la ruta.
  const spunZones = new Set(placeIds.map((id) => findPlace(live, id)?.zone).filter(Boolean));
  const nearby = (place: PlanPlace) => (zone === 'toda' ? spunZones.size === 0 || spunZones.has(place.zone) : place.zone === zone);
  const backups = shuffle(live.places.filter((place) => !spun.has(place.id) && MOMENT_INTERESTS[moment].includes(place.interest) && nearby(place))).slice(0, MAX_ROULETTE_BACKUPS);
  const spunPlaces = placeIds.map((id) => findPlace(live, id)!);
  const catalog = numbered([...spunPlaces, ...backups]);
  const lines = catalog.text(new Set(locked)).split('\n');
  const momentLabel = moment === 'sorpresa' ? 'cualquier hora (elige la mejor)' : labelFor(ROULETTE_MOMENTS, moment);
  const user = [
    `Momento: ${momentLabel}. Paradas: exactamente ${placeIds.length}, sin repetir.`,
    '',
    'Salieron (n|nombre|tipo|precio|zona|qué es; * = fija):',
    ...lines.slice(0, spunPlaces.length),
    '',
    'Apoyo, sólo para reemplazos:',
    ...lines.slice(spunPlaces.length),
  ].join('\n');
  // Hasta 5 paradas: un poco más de espacio para la respuesta.
  const raw = await askDeepSeek(ROULETTE_PROMPT, user, 800, 0.9);
  if (!raw) return null;

  const allowed = new Set(catalog.list.map((place) => place.id));
  const seen = new Set<string>();
  const stops = (Array.isArray(raw.stops) ? raw.stops : [])
    .map((stop) => toStop(stop, catalog.idOf))
    .filter((stop) => {
      if (!allowed.has(stop.placeId) || seen.has(stop.placeId)) return false;
      seen.add(stop.placeId);
      return true;
    });
  // Las fijas siempre van; si el modelo se pasó o se quedó corto, se completa con lo que salió en la ruleta.
  for (const id of locked) if (!seen.has(id)) { stops.push({ placeId: id, time: '', why: '' }); seen.add(id); }
  for (let index = stops.length - 1; index >= 0 && stops.length > placeIds.length; index -= 1) {
    if (!locked.includes(stops[index].placeId)) stops.splice(index, 1);
  }
  for (const id of placeIds) if (stops.length < placeIds.length && !seen.has(id)) { stops.push({ placeId: id, time: '', why: '' }); seen.add(id); }

  return {
    title: clean(raw.title, 80) || 'Lo que salió en la ruleta',
    thread: clean(raw.thread, 240),
    intro: clean(raw.intro, 400),
    stops,
    closing: clean(raw.closing, 300),
  };
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const slot = await takePlanSlot(request);
    if (slot === 'ip') return response.status(429).json({ error: 'Armaste muchos planes seguidos. Espera un rato y vuelve a intentar.' });
    if (slot === 'global') return response.status(429).json({ error: 'El generador de planes descansa por hoy. Vuelve mañana.' });
  } catch (error) {
    console.error('Custom plan rate limit error:', error);
    return response.status(503).json({ error: 'No pudimos armar tu plan. Inténtalo otra vez.' });
  }

  const live = await getLiveCatalog();

  if (request.body?.mode === 'roulette') {
    const roulette = parseRouletteRequest(request.body, (id) => Boolean(findPlace(live, id)));
    if (!roulette) return response.status(400).json({ error: 'Gira la ruleta antes de armar el plan.' });
    if (!process.env.DEEPSEEK_API_KEY) return response.status(500).json({ error: 'El generador de planes todavía no está configurado.' });
    try {
      const plan = await generateRoulettePlan(live, roulette);
      if (!plan) return response.status(502).json({ error: 'No encontramos el hilo esta vez. Inténtalo otra vez.' });
      return response.status(200).json({ plan });
    } catch (error) {
      console.error('Roulette plan error:', error);
      return response.status(error instanceof UpstreamError ? 502 : 500).json({ error: 'No pudimos armar tu plan. Inténtalo otra vez.' });
    }
  }

  const choices = parsePlanChoices(request.body);
  if (!choices) {
    return response.status(400).json({ error: 'Elige una opción en cada paso para armar tu plan.' });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return response.status(500).json({ error: 'El generador de planes todavía no está configurado.' });
  }

  try {
    if (request.body?.mode === 'swap') {
      const planPlaceIds: string[] = Array.isArray(request.body.planPlaceIds) ? request.body.planPlaceIds.filter((id: unknown) => typeof id === 'string') : [];
      const swapIndex = Number(request.body.swapIndex);
      if (planPlaceIds.length === 0 || planPlaceIds.length > 4 || !planPlaceIds.every((id) => findPlace(live, id)) || !Number.isInteger(swapIndex) || !planPlaceIds[swapIndex]) {
        return response.status(400).json({ error: 'No pudimos cambiar esa parada.' });
      }
      const stop = await swapStop(live, choices, planPlaceIds, swapIndex);
      if (!stop) return response.status(502).json({ error: 'No encontramos otra opción. Inténtalo otra vez.' });
      return response.status(200).json({ stop });
    }

    const plan = await generatePlan(live, choices);
    if (!plan) return response.status(502).json({ error: 'El plan salió incompleto. Inténtalo otra vez.' });
    return response.status(200).json({ plan });
  } catch (error) {
    console.error('Custom plan error:', error);
    return response.status(error instanceof UpstreamError ? 502 : 500).json({ error: 'No pudimos armar tu plan. Inténtalo otra vez.' });
  }
}
