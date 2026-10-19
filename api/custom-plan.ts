import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  INTEREST_OPTIONS,
  MOMENT_OPTIONS,
  PLAN_PLACES,
  PLAN_PLACES_BY_ID,
  VIBE_OPTIONS,
  labelFor,
  parsePlanChoices,
  type CustomPlan,
  type PlanChoices,
  type PlanPlace,
  type PlanStop,
} from '../src/data/planBuilder.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MAX_PLACES_PER_INTEREST = 30;

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

const catalogFor = (choices: PlanChoices, exclude: Set<string> = new Set()) =>
  choices.interests.flatMap((interest) =>
    shuffle(PLAN_PLACES.filter((place) => place.interest === interest && !exclude.has(place.id))).slice(0, MAX_PLACES_PER_INTEREST),
  );

const catalogText = (places: PlanPlace[]) =>
  places.map((place) => [place.id, place.name, place.type, place.price ?? 's/p', place.tip && place.tip !== place.description ? `${place.description} Ve por: ${place.tip}.` : place.description].join(' | ')).join('\n');

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

const PLAN_PROMPT = [
  'Eres el editor de Bruuk, una guía hecha por personas para salir en Guadalajara. Lema: menos pantalla, más mundo.',
  'Armas planes usando EXCLUSIVAMENTE lugares del catálogo. Nunca inventes lugares, direcciones, precios, platillos ni horarios que no estén en la descripción del catálogo.',
  'Todo lo que digas de un lugar debe venir de su descripción en el catálogo. Si el catálogo no lo dice, no lo digas.',
  'Escribe en español de México, cercano y directo. Nada de frases de folleto ni emojis.',
  'Ordena las paradas en una secuencia lógica para el momento del día (el atardecer cae alrededor de las 19:00; los bares van de noche).',
  'Si el catálogo menciona días u horarios (un tianguis que sólo abre sábado), respétalos y dilo en "why".',
  'Responde sólo JSON: {"title": "máx. 6 palabras", "intro": "1 o 2 frases", "stops": [{"placeId": "id exacto del catálogo", "time": "ej. 10:00", "why": "por qué encaja, 1 o 2 frases basadas en el catálogo"}], "closing": "1 frase"}',
].join('\n');

const toStop = (value: unknown): PlanStop => {
  const stop = (value ?? {}) as Record<string, unknown>;
  return { placeId: clean(stop.placeId, 80), time: clean(stop.time, 20), why: clean(stop.why, 400) };
};

const generatePlan = async (choices: PlanChoices): Promise<CustomPlan | null> => {
  const user = [
    'Opciones elegidas:',
    choicesText(choices),
    `- Paradas: exactamente ${choices.stops}, sin repetir lugares, cubriendo los intereses elegidos cuando sea posible.`,
    '',
    'Catálogo (id | nombre | tipo | precio | descripción):',
    catalogText(catalogFor(choices)),
  ].join('\n');
  const raw = await askDeepSeek(PLAN_PROMPT, user, 1200, 1.1);
  if (!raw) return null;

  const seen = new Set<string>();
  const stops = (Array.isArray(raw.stops) ? raw.stops : [])
    .map(toStop)
    .filter((stop) => {
      if (!PLAN_PLACES_BY_ID.has(stop.placeId) || seen.has(stop.placeId)) return false;
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
const swapStop = async (choices: PlanChoices, planPlaceIds: string[], swapIndex: number): Promise<PlanStop | null> => {
  const current = PLAN_PLACES_BY_ID.get(planPlaceIds[swapIndex])!;
  const exclude = new Set(planPlaceIds);
  const user = [
    'Opciones elegidas:',
    choicesText(choices),
    '',
    'Plan actual, en orden:',
    ...planPlaceIds.map((id, index) => `${index + 1}. ${PLAN_PLACES_BY_ID.get(id)!.name}${index === swapIndex ? '  <- REEMPLAZAR' : ''}`),
    '',
    `La persona quiere cambiar "${current.name}" por otra opción distinta que encaje en esa misma posición del recorrido.`,
    'Devuelve un solo objeto en "stops" con el lugar nuevo.',
    '',
    'Catálogo (id | nombre | tipo | precio | descripción):',
    catalogText(catalogFor(choices, exclude)),
  ].join('\n');
  const raw = await askDeepSeek(PLAN_PROMPT, user, 500, 1.1);
  const stop = toStop(Array.isArray(raw?.stops) ? raw.stops[0] : null);
  if (!PLAN_PLACES_BY_ID.has(stop.placeId) || exclude.has(stop.placeId)) return null;
  return stop;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
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
      if (planPlaceIds.length === 0 || planPlaceIds.length > 4 || !planPlaceIds.every((id) => PLAN_PLACES_BY_ID.has(id)) || !Number.isInteger(swapIndex) || !planPlaceIds[swapIndex]) {
        return response.status(400).json({ error: 'No pudimos cambiar esa parada.' });
      }
      const stop = await swapStop(choices, planPlaceIds, swapIndex);
      if (!stop) return response.status(502).json({ error: 'No encontramos otra opción. Inténtalo otra vez.' });
      return response.status(200).json({ stop });
    }

    const plan = await generatePlan(choices);
    if (!plan) return response.status(502).json({ error: 'El plan salió incompleto. Inténtalo otra vez.' });
    return response.status(200).json({ plan });
  } catch (error) {
    console.error('Custom plan error:', error);
    return response.status(error instanceof UpstreamError ? 502 : 500).json({ error: 'No pudimos armar tu plan. Inténtalo otra vez.' });
  }
}
