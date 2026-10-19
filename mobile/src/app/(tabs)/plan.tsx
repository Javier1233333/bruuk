import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Body, Button, Kicker, openUrl } from '../../components/ui';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  INTEREST_OPTIONS,
  MAX_INTERESTS,
  MAX_NOTE_LENGTH,
  MOMENT_OPTIONS,
  STOP_OPTIONS,
  VIBE_OPTIONS,
  getPlace,
  labelFor,
  type CustomPlan,
  type PlanChoices,
  type PlanInterest,
  type PlanStop,
} from '../../lib/catalog';
import { postApi } from '../../lib/api';
import { colors, fonts, space } from '../../theme';

type StepId = 'moment' | 'company' | 'interests' | 'vibe' | 'budget';
type Status = 'choosing' | 'loading' | 'result';
type Draft = Partial<Omit<PlanChoices, 'interests' | 'note'>> & { interests: PlanInterest[]; note: string };
type Option = { value: string; label: string; hint: string };

const STEPS: StepId[] = ['moment', 'company', 'interests', 'vibe', 'budget'];

const STEP_COPY: Record<StepId, { question: string; helper: string }> = {
  moment: { question: '¿Cuándo quieres salir?', helper: 'El plan se ordena según la hora del día.' },
  company: { question: '¿Con quién vas?', helper: 'No es lo mismo una cita que un grupo de amigos.' },
  interests: { question: '¿Qué se te antoja?', helper: `Elige hasta ${MAX_INTERESTS}. Las paradas salen de estas categorías.` },
  vibe: { question: '¿Qué ritmo buscas?', helper: 'Para decidir entre un rincón tranquilo o un lugar con ambiente.' },
  budget: { question: '¿Cuánto quieres gastar?', helper: 'Por persona, cuántas paradas y cualquier detalle extra.' },
};

const SINGLE_OPTIONS = { moment: MOMENT_OPTIONS, company: COMPANY_OPTIONS, vibe: VIBE_OPTIONS } as const;
type SingleStep = keyof typeof SINGLE_OPTIONS;

function OptionGrid({ options, isSelected, onSelect, isDisabled }: { options: readonly Option[]; isSelected: (value: string) => boolean; onSelect: (value: string) => void; isDisabled?: (value: string) => boolean }) {
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        const disabled = isDisabled?.(option.value) ?? false;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(option.value)}
            style={[styles.option, selected && styles.optionActive, disabled && { opacity: 0.4 }]}
          >
            <Text style={[styles.optionLabel, selected && { color: colors.white }]}>{option.label}</Text>
            <Text style={[styles.optionHint, selected && { color: '#d6d0ff' }]}>{option.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function PlanScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({ interests: [], stops: 3, note: '' });
  const [status, setStatus] = useState<Status>('choosing');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<CustomPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const isStepComplete = (id: StepId) => {
    if (id === 'interests') return draft.interests.length > 0;
    if (id === 'budget') return Boolean(draft.budget && draft.stops);
    return Boolean(draft[id]);
  };

  const goTo = (index: number) => {
    setError('');
    setStepIndex(index);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const chooseSingle = (id: SingleStep, value: string) => {
    setDraft((current) => ({ ...current, [id]: value }));
    setError('');
    if (isEditing) return;
    const from = stepIndex;
    setTimeout(() => setStepIndex((current) => (current === from ? from + 1 : current)), 160);
  };

  const toggleInterest = (value: string) => {
    const interest = value as PlanInterest;
    setError('');
    setDraft((current) => {
      if (current.interests.includes(interest)) return { ...current, interests: current.interests.filter((item) => item !== interest) };
      if (current.interests.length >= MAX_INTERESTS) return current;
      return { ...current, interests: [...current.interests, interest] };
    });
  };

  const generate = async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await postApi<{ plan: CustomPlan }>('custom-plan', draft);
      setPlan(result.plan);
      setIsEditing(false);
      setStatus('result');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch (generateError) {
      setStatus('choosing');
      setError(generateError instanceof Error ? generateError.message : 'No pudimos armar tu plan.');
    }
  };

  const swap = async (index: number) => {
    if (!plan) return;
    setSwappingIndex(index);
    setError('');
    try {
      const { stop } = await postApi<{ stop: PlanStop }>('custom-plan', { ...draft, mode: 'swap', planPlaceIds: plan.stops.map((item) => item.placeId), swapIndex: index });
      setPlan((current) => current && { ...current, stops: current.stops.map((item, position) => (position === index ? stop : item)) });
    } catch (swapError) {
      setError(swapError instanceof Error ? swapError.message : 'No pudimos cambiar esa parada.');
    } finally {
      setSwappingIndex(null);
    }
  };

  const handleNext = () => {
    const incomplete = STEPS.some((id) => !isStepComplete(id));
    if (!isStepComplete(step) || ((isLastStep || isEditing) && incomplete)) {
      setError(step === 'interests' ? 'Elige al menos una opción.' : 'Elige una opción para seguir.');
      return;
    }
    if (isLastStep || isEditing) void generate();
    else goTo(stepIndex + 1);
  };

  const editStep = (index: number) => {
    setIsEditing(true);
    setStatus('choosing');
    goTo(index);
  };

  const summary = [
    draft.moment && { label: labelFor(MOMENT_OPTIONS, draft.moment), step: 0 },
    draft.company && { label: labelFor(COMPANY_OPTIONS, draft.company), step: 1 },
    ...draft.interests.map((interest) => ({ label: labelFor(INTEREST_OPTIONS, interest), step: 2 })),
    draft.vibe && { label: labelFor(VIBE_OPTIONS, draft.vibe), step: 3 },
    draft.budget && { label: `${labelFor(BUDGET_OPTIONS, draft.budget)} · ${draft.stops} paradas`, step: 4 },
  ].filter((item): item is { label: string; step: number } => Boolean(item));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Kicker>/ ARMA TU PLAN · GDL</Kicker>
        <Text style={styles.heading}>ELIGE. <Text style={{ color: colors.violet }}>SAL.</Text></Text>

        <View style={styles.card}>
          {status === 'loading' && (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.violetDeep} size="large" />
              <Text style={styles.cardTitle}>BUSCANDO EN LA GUÍA…</Text>
              <Body dark>Elegimos entre los lugares de Bruuk los que mejor encajan con lo que pediste.</Body>
            </View>
          )}

          {status === 'result' && plan && (
            <View style={{ gap: 16 }}>
              <Kicker dark>✓ TU PLAN</Kicker>
              <Text style={styles.cardTitle}>{plan.title.toUpperCase()}</Text>
              {plan.intro ? <Body dark>{plan.intro}</Body> : null}

              <Kicker dark>AJUSTA UNA OPCIÓN</Kicker>
              <View style={styles.adjust}>
                {summary.map((item) => (
                  <Pressable key={item.label} onPress={() => editStep(item.step)} style={styles.adjustChip}>
                    <Text style={styles.adjustText}>{item.label.toUpperCase()}</Text>
                    <Feather name="edit-2" size={11} color={colors.ink} />
                  </Pressable>
                ))}
              </View>

              {plan.stops.map((stop, index) => {
                const place = getPlace(stop.placeId);
                if (!place) return null;
                return (
                  <View key={stop.placeId} style={[styles.stop, swappingIndex === index && { opacity: 0.5 }]}>
                    <View style={styles.stopMarker}>
                      <Text style={styles.stopNumber}>{String(index + 1).padStart(2, '0')}</Text>
                      {stop.time ? <Text style={styles.stopTime}>{stop.time}</Text> : null}
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={styles.stopType}>{place.type.toUpperCase()}{place.price ? ` · ${place.price}` : ''}</Text>
                      <Pressable onPress={() => router.push(`/lugar/${place.id}`)}>
                        <Text style={styles.stopName}>{place.name}</Text>
                      </Pressable>
                      {stop.why ? <Body dark>{stop.why}</Body> : null}
                      {place.tip ? (
                        <View style={styles.tip}>
                          <Text style={styles.tipText}><Text style={styles.tipLabel}>VE POR  </Text>{place.tip}</Text>
                          <Text style={styles.tipSource}>Recomendación de la guía Bruuk</Text>
                        </View>
                      ) : null}
                      <View style={styles.stopActions}>
                        <Pressable onPress={() => openUrl(place.mapsUrl)} style={styles.link}>
                          <Text style={styles.linkText}>CÓMO LLEGAR</Text><Feather name="arrow-up-right" size={14} color={colors.ink} />
                        </Pressable>
                        <Pressable onPress={() => void swap(index)} disabled={swappingIndex !== null} style={styles.link}>
                          <Feather name="shuffle" size={14} color={colors.violetDeep} />
                          <Text style={[styles.linkText, { color: colors.violetDeep }]}>{swappingIndex === index ? 'BUSCANDO…' : 'CAMBIAR'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
              {plan.closing ? <Text style={styles.closing}>{plan.closing}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label="OTRO PLAN" icon="refresh-cw" onPress={() => void generate()} disabled={swappingIndex !== null} />
              <Button label="CAMBIAR OPCIONES" icon="sliders" variant="secondary" onPress={() => editStep(0)} />
              <Text style={styles.note}>La IA ordena el plan; los lugares y las recomendaciones salen de la guía Bruuk. Revisa horarios antes de salir.</Text>
            </View>
          )}

          {status === 'choosing' && (
            <View style={{ gap: 14 }}>
              <Text style={styles.stepCount}>{isEditing ? 'AJUSTANDO TU PLAN' : `PASO ${stepIndex + 1} DE ${STEPS.length}`}</Text>
              <View style={styles.bar}><View style={[styles.barFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} /></View>
              <Text style={styles.question}>{STEP_COPY[step].question}</Text>
              <Body dark>{STEP_COPY[step].helper}</Body>

              {(step === 'moment' || step === 'company' || step === 'vibe') && (
                <OptionGrid options={SINGLE_OPTIONS[step]} isSelected={(value) => draft[step] === value} onSelect={(value) => chooseSingle(step, value)} />
              )}
              {step === 'interests' && (
                <OptionGrid
                  options={INTEREST_OPTIONS}
                  isSelected={(value) => draft.interests.includes(value as PlanInterest)}
                  isDisabled={(value) => !draft.interests.includes(value as PlanInterest) && draft.interests.length >= MAX_INTERESTS}
                  onSelect={toggleInterest}
                />
              )}
              {step === 'budget' && (
                <>
                  <OptionGrid options={BUDGET_OPTIONS} isSelected={(value) => draft.budget === value} onSelect={(value) => setDraft((current) => ({ ...current, budget: value as Draft['budget'] }))} />
                  <Text style={styles.stepCount}>PARADAS</Text>
                  <View style={styles.stops}>
                    {STOP_OPTIONS.map((value) => (
                      <Pressable key={value} onPress={() => setDraft((current) => ({ ...current, stops: value }))} style={[styles.stopChip, draft.stops === value && styles.optionActive]}>
                        <Text style={[styles.optionLabel, draft.stops === value && { color: colors.white }]}>{value}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.stepCount}>¿ALGO MÁS? <Text style={{ color: colors.muted }}>OPCIONAL</Text></Text>
                  <TextInput
                    value={draft.note}
                    onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
                    placeholder="Ej. sin alcohol, que acepte mascotas…"
                    placeholderTextColor="#8a8794"
                    maxLength={MAX_NOTE_LENGTH}
                    multiline
                    style={styles.noteInput}
                  />
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}>
                {stepIndex > 0 && !isEditing && (
                  <Pressable accessibilityLabel="Paso anterior" onPress={() => goTo(stepIndex - 1)} style={styles.back}>
                    <Feather name="chevron-left" size={22} color={colors.ink} />
                  </Pressable>
                )}
                {isEditing && plan && (
                  <Button label="VOLVER" variant="secondary" onPress={() => { setIsEditing(false); setError(''); setStatus('result'); }} style={{ flex: 1 }} />
                )}
                <Button
                  label={isEditing ? 'ACTUALIZAR' : isLastStep ? 'ARMAR MI PLAN' : 'SIGUIENTE'}
                  icon={isEditing ? 'refresh-cw' : isLastStep ? 'zap' : 'arrow-right'}
                  onPress={handleNext}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 48, gap: 12 },
  heading: { color: colors.paper, fontFamily: fonts.display, fontSize: 40, letterSpacing: -1.6 },
  card: { padding: 18, backgroundColor: colors.paper, shadowColor: colors.violet, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
  loading: { alignItems: 'flex-start', gap: 14, paddingVertical: 30 },
  cardTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 30, lineHeight: 30, letterSpacing: -1.2 },
  stepCount: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  bar: { height: 4, backgroundColor: 'rgba(11,10,18,0.12)' },
  barFill: { height: 4, backgroundColor: colors.ink },
  question: { color: colors.ink, fontFamily: fonts.display, fontSize: 30, lineHeight: 31, letterSpacing: -1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { width: '48.5%', minHeight: 80, padding: 12, gap: 4, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink },
  optionActive: { backgroundColor: colors.ink },
  optionLabel: { color: colors.ink, fontFamily: fonts.display, fontSize: 16 },
  optionHint: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  stops: { flexDirection: 'row', gap: 8 },
  stopChip: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  noteInput: { minHeight: 64, padding: 12, color: colors.ink, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink, fontFamily: fonts.body, fontSize: 16, textAlignVertical: 'top' },
  error: { padding: 10, color: colors.white, backgroundColor: colors.error, fontFamily: fonts.body, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  back: { width: 54, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  adjust: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  adjustChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingHorizontal: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink },
  adjustText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 11 },
  stop: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1.5, borderColor: colors.ink },
  stopMarker: { width: 48, gap: 4 },
  stopNumber: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  stopTime: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11 },
  stopType: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  stopName: { color: colors.ink, fontFamily: fonts.display, fontSize: 20, lineHeight: 22, textDecorationLine: 'underline', textDecorationColor: colors.violet },
  tip: { padding: 10, gap: 4, backgroundColor: colors.lilac },
  tipText: { color: colors.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  tipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  tipSource: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 11 },
  stopActions: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  linkText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.2 },
  closing: { paddingTop: 14, borderTopWidth: 1.5, borderColor: colors.ink, color: colors.ink, fontFamily: fonts.heading, fontSize: 16 },
  note: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
});
