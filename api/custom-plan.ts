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
} from '../src/data/planBuilder';

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

// Mezclamos el catálogo para que dos planes con las mismas opciones no salgan idénticos.
const catalogFor = (choices: PlanChoices) =>
  choices.interests.flatMap((interest) =>
    shuffle(PLAN_PLACES.filter((place) => place.interest === interest)).slice(0, MAX_PLACES_PER_INTEREST),
  );

const SYSTEM_PROMPT = [
  'Eres el editor de Bruuk, una guía hecha por personas para salir en Guadalajara. Lema: menos pantalla, más mundo.',
  'Armas planes concretos usando EXCLUSIVAMENTE lugares del catálogo que te dan. Nunca inventes lugares, direcciones, precios ni horarios que no estén en el catálogo.',
  'Escribe en español de México, cercano y directo, como un amigo que conoce la ciudad. Nada de frases de folleto ni emojis.',
  'Ordena las paradas en una secuencia lógica para el momento del día elegido (por ejemplo, el atardecer cae alrededor de las 19:00 y los bares van de noche).',
  'Si el catálogo menciona días u horarios (como un tianguis que sólo abre sábado), respétalos y menciónalos en el consejo.',
  'Responde sólo con JSON válido con esta forma:',
  '{"title": "máx. 6 palabras", "intro": "1 o 2 frases", "stops": [{"placeId": "id exacto del catálogo", "time": "hora aproximada, ej. 10:00", "why": "por qué esta parada encaja con lo que pidió, 1 o 2 frases", "tip": "un consejo práctico y concreto"}], "closing": "1 frase para cerrar el plan"}',
].join('\n');

const userPrompt = (choices: PlanChoices) => {
  const catalog = catalogFor(choices)
    .map((place) => [place.id, place.name, place.type, place.price ?? 's/p', place.description].join(' | '))
    .join('\n');
  return [
    'Opciones elegidas:',
    `- Momento: ${labelFor(MOMENT_OPTIONS, choices.moment)}`,
    `- Con quién: ${labelFor(COMPANY_OPTIONS, choices.company)}`,
    `- Le interesa: ${choices.interests.map((interest) => labelFor(INTEREST_OPTIONS, interest)).join(', ')}`,
    `- Ritmo: ${labelFor(VIBE_OPTIONS, choices.vibe)}`,
    `- Presupuesto por persona: ${BUDGET_OPTIONS.find((option) => option.value === choices.budget)?.hint}`,
    `- Número de paradas: exactamente ${choices.stops}, sin repetir lugares, cubriendo los intereses elegidos cuando sea posible.`,
    '',
    'Catálogo (id | nombre | tipo | precio | descripción):',
    catalog,
  ].join('\n');
};

// El modelo puede equivocarse: sólo aceptamos paradas que existen en el catálogo.
const sanitizePlan = (raw: unknown, choices: PlanChoices): CustomPlan | null => {
  if (!raw || typeof raw !== 'object') return null;
  const plan = raw as Record<string, unknown>;
  const seen = new Set<string>();
  const stops = (Array.isArray(plan.stops) ? plan.stops : [])
    .map((stop) => {
      const value = (stop ?? {}) as Record<string, unknown>;
      return { placeId: clean(value.placeId, 80), time: clean(value.time, 20), why: clean(value.why, 400), tip: clean(value.tip, 300) };
    })
    .filter((stop) => {
      if (!PLAN_PLACES_BY_ID.has(stop.placeId) || seen.has(stop.placeId)) return false;
      seen.add(stop.placeId);
      return true;
    })
    .slice(0, choices.stops);

  if (stops.length === 0) return null;
  return {
    title: clean(plan.title, 80) || 'Tu plan en Guadalajara',
    intro: clean(plan.intro, 400),
    stops,
    closing: clean(plan.closing, 300),
  };
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
  }

  const choices = parsePlanChoices(request.body);
  if (!choices) {
    return response.status(400).json({ error: 'Elige una opción en cada paso para armar tu plan.' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'El generador de planes todavía no está configurado.' });
  }

  try {
    const deepseekResponse = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt(choices) },
        ],
        response_format: { type: 'json_object' },
        temperature: 1.1,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!deepseekResponse.ok) {
      console.error('DeepSeek error:', deepseekResponse.status, await deepseekResponse.text());
      return response.status(502).json({ error: 'No pudimos armar tu plan. Inténtalo otra vez.' });
    }

    const result = await deepseekResponse.json();
    const content = result?.choices?.[0]?.message?.content;
    let parsed: unknown = null;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : null;
    } catch {
      parsed = null;
    }

    const plan = sanitizePlan(parsed, choices);
    if (!plan) {
      console.error('DeepSeek returned an unusable plan:', content);
      return response.status(502).json({ error: 'El plan salió incompleto. Inténtalo otra vez.' });
    }

    return response.status(200).json({ plan });
  } catch (error) {
    console.error('Custom plan error:', error);
    return response.status(500).json({ error: 'No pudimos armar tu plan. Inténtalo otra vez.' });
  }
}
