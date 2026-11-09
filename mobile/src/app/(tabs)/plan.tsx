import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance, type ViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useScrollToTop } from 'expo-router';
import { Dices, ListChecks } from 'lucide-react-native';
import { PlanResult } from '../../components/plan/PlanResult';
import { Questions, STEPS, isStepComplete, type Draft } from '../../components/plan/Questions';
import { Roulette } from '../../components/plan/Roulette';
import { SharePlanCard } from '../../components/plan/SharePlanCard';
import { TopBar } from '../../components/TopBar';
import { Kicker, ShadowBox, tap } from '../../components/ui';
import { BUDGET_OPTIONS, COMPANY_OPTIONS, INTEREST_OPTIONS, MOMENT_OPTIONS, VIBE_OPTIONS, labelFor, type CustomPlan, type PlanStop } from '../../lib/catalog';
import { postApi } from '../../lib/api';
import { useContent } from '../../lib/content';
import type { RouletteState } from '../../lib/roulette';
import { shareViewAsImage } from '../../lib/shareImage';
import { colors, fonts, space } from '../../theme';

type Mode = 'ruleta' | 'preguntas';
type View_ = 'choosing' | 'loading' | 'result';

const INITIAL_ROULETTE: RouletteState = { moment: 'sorpresa', zone: 'toda', interests: [], count: 3, slots: [] };

export default function PlanScreen() {
  const { places, config, getPlace } = useContent();
  // "Armar un plan" desde un lugar: entra a la ruleta con ese lugar fijo.
  const { con } = useLocalSearchParams<{ con?: string }>();
  const canRoulette = config.features.ruleta;
  const canQuestions = config.features.preguntas;
  const [mode, setMode] = useState<Mode>(canRoulette ? 'ruleta' : 'preguntas');
  const [view, setView] = useState<View_>('choosing');
  const [roulette, setRoulette] = useState<RouletteState>(INITIAL_ROULETTE);
  const [draft, setDraft] = useState<Draft>({ interests: [], stops: 3, note: '' });
  const [stepIndex, setStepIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState<CustomPlan | null>(null);
  const [spunIds, setSpunIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const shareRef = useRef<ViewInstance>(null);
  useScrollToTop(scrollRef);

  useEffect(() => {
    if (!con || !getPlace(con) || !canRoulette) return;
    setMode('ruleta');
    setView('choosing');
    setPlan(null);
    setRoulette({ ...INITIAL_ROULETTE, slots: [{ placeId: con, locked: true }] });
  }, [con, getPlace, canRoulette]);

  useEffect(() => {
    if (!canRoulette && mode === 'ruleta') setMode('preguntas');
    if (!canQuestions && mode === 'preguntas' && canRoulette) setMode('ruleta');
  }, [canRoulette, canQuestions, mode]);

  const toTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  const generateFromRoulette = async () => {
    const placeIds = roulette.slots.map((slot) => slot.placeId);
    setView('loading');
    setError('');
    try {
      const { plan: result } = await postApi<{ plan: CustomPlan }>('custom-plan', {
        mode: 'roulette',
        placeIds,
        locked: roulette.slots.filter((slot) => slot.locked).map((slot) => slot.placeId),
        moment: roulette.moment,
        zone: roulette.zone,
      });
      setSpunIds(placeIds);
      setPlan(result);
      setView('result');
      toTop();
    } catch (requestError) {
      setView(plan ? 'result' : 'choosing');
      setError(requestError instanceof Error ? requestError.message : 'No pudimos armar tu plan.');
    }
  };

  const generateFromQuestions = async () => {
    setView('loading');
    setError('');
    try {
      const { plan: result } = await postApi<{ plan: CustomPlan }>('custom-plan', draft);
      setPlan(result);
      setEditing(false);
      setView('result');
      toTop();
    } catch (requestError) {
      setView('choosing');
      setError(requestError instanceof Error ? requestError.message : 'No pudimos armar tu plan.');
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

  const share = async () => {
    setSharing(true);
    setError('');
    try {
      await shareViewAsImage(shareRef, 'Compartir mi plan');
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'No pudimos crear la imagen.');
    } finally {
      setSharing(false);
    }
  };

  const nextQuestion = () => {
    const step = STEPS[stepIndex];
    const incomplete = STEPS.some((id) => !isStepComplete(draft, id));
    if (!isStepComplete(draft, step) || ((stepIndex === STEPS.length - 1 || editing) && incomplete)) {
      setError(step === 'interests' ? 'Elige al menos una opción.' : 'Elige una opción para seguir.');
      return;
    }
    if (stepIndex === STEPS.length - 1 || editing) void generateFromQuestions();
    else {
      setError('');
      setStepIndex(stepIndex + 1);
      toTop();
    }
  };

  const summary = [
    draft.moment && { label: labelFor(MOMENT_OPTIONS, draft.moment), step: 0 },
    draft.company && { label: labelFor(COMPANY_OPTIONS, draft.company), step: 1 },
    ...draft.interests.map((interest) => ({ label: labelFor(INTEREST_OPTIONS, interest), step: 2 })),
    draft.vibe && { label: labelFor(VIBE_OPTIONS, draft.vibe), step: 3 },
    draft.budget && { label: `${labelFor(BUDGET_OPTIONS, draft.budget)} · ${draft.stops} paradas`, step: 4 },
  ].filter((item): item is { label: string; step: number } => Boolean(item));

  const switchMode = (next: Mode) => {
    tap();
    setMode(next);
    setView('choosing');
    setPlan(null);
    setError('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TopBar />
        <Kicker>/ ARMA TU PLAN · GDL</Kicker>
        <Text style={styles.heading} accessibilityRole="header">ELIGE. <Text style={{ color: colors.violet }}>SAL.</Text></Text>
        <Text style={styles.lead}>{places.length} lugares. {config.copy.planLead}</Text>

        {canRoulette && canQuestions && view !== 'result' && (
          <View style={styles.modes} accessibilityRole="tablist">
            {([['ruleta', 'RULETA', Dices], ['preguntas', '5 PREGUNTAS', ListChecks]] as const).map(([value, label, Icon]) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === value }}
                onPress={() => switchMode(value)}
                style={[styles.mode, mode === value && styles.modeActive]}
              >
                <Icon size={16} color={mode === value ? colors.ink : colors.paper} />
                <Text style={[styles.modeText, mode === value && { color: colors.ink }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <ShadowBox offset={6}>
          <View style={styles.card}>
            {view === 'loading' && (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.violetDeep} size="large" />
                <Text style={styles.loadingTitle}>{mode === 'ruleta' ? 'BUSCANDO EL HILO…' : 'BUSCANDO EN LA GUÍA…'}</Text>
                <Text style={styles.lead2}>Elegimos y ordenamos lugares de Bruuk para lo que pediste.</Text>
              </View>
            )}

            {view === 'result' && plan && (
              <PlanResult
                plan={plan}
                mode={mode}
                spunIds={spunIds}
                summary={summary}
                error={error}
                sharing={sharing}
                swappingIndex={swappingIndex}
                busy={false}
                onShare={() => void share()}
                onSwap={(index) => void swap(index)}
                onEdit={(step) => {
                  setEditing(true);
                  setStepIndex(step);
                  setView('choosing');
                  toTop();
                }}
                onRespin={() => {
                  setView('choosing');
                  setRoulette((current) => ({ ...current, slots: current.slots.map((slot) => ({ ...slot, locked: false })) }));
                  toTop();
                }}
                onRethread={() => void generateFromRoulette()}
                onAgain={() => void generateFromQuestions()}
              />
            )}

            {view === 'choosing' && mode === 'ruleta' && (
              <>
                <Roulette state={roulette} onChange={setRoulette} onGenerate={() => void generateFromRoulette()} loading={false} />
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </>
            )}

            {view === 'choosing' && mode === 'preguntas' && (
              <Questions
                draft={draft}
                stepIndex={stepIndex}
                editing={editing}
                error={error}
                loading={false}
                onDraft={(update) => {
                  setError('');
                  setDraft(update);
                }}
                onStep={(index) => {
                  setError('');
                  setStepIndex(index);
                }}
                onNext={nextQuestion}
                onBack={plan ? () => {
                  setEditing(false);
                  setError('');
                  setView('result');
                } : undefined}
              />
            )}
          </View>
        </ShadowBox>
      </ScrollView>

      {/* La imagen para compartir se dibuja fuera de la pantalla */}
      {plan && (
        <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SharePlanCard ref={shareRef} plan={plan} getPlace={getPlace} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 48, gap: 12 },
  heading: { color: colors.paper, fontFamily: fonts.display, fontSize: 44, letterSpacing: -1.8 },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  modes: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.paper },
  mode: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modeActive: { backgroundColor: colors.violet },
  modeText: { color: colors.paper, fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.2 },
  card: { padding: 16, backgroundColor: colors.paper },
  loading: { alignItems: 'flex-start', gap: 14, paddingVertical: 30 },
  loadingTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 28, lineHeight: 28, letterSpacing: -1 },
  lead2: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  error: { marginTop: 12, padding: 10, color: colors.white, backgroundColor: colors.error, fontFamily: fonts.body, fontSize: 14 },
  offscreen: { position: 'absolute', top: 0, left: -10000 },
});
