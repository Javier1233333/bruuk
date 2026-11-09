import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowRight, ChevronLeft, RefreshCw, Sparkles } from 'lucide-react-native';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  INTEREST_OPTIONS,
  MAX_INTERESTS,
  MAX_NOTE_LENGTH,
  MOMENT_OPTIONS,
  STOP_OPTIONS,
  VIBE_OPTIONS,
  type PlanChoices,
  type PlanInterest,
} from '../../lib/catalog';
import { colors, fonts } from '../../theme';
import { Button, ErrorNote, tap } from '../ui';

export type Draft = Partial<Omit<PlanChoices, 'interests' | 'note'>> & { interests: PlanInterest[]; note: string };
export type StepId = 'moment' | 'company' | 'interests' | 'vibe' | 'budget';
export const STEPS: StepId[] = ['moment', 'company', 'interests', 'vibe', 'budget'];

const COPY: Record<StepId, { question: string; helper: string }> = {
  moment: { question: '¿Cuándo quieres salir?', helper: 'El plan se ordena según la hora del día.' },
  company: { question: '¿Con quién vas?', helper: 'No es lo mismo una cita que un grupo de amigos.' },
  interests: { question: '¿Qué se te antoja?', helper: `Elige hasta ${MAX_INTERESTS}. Las paradas salen de estas categorías.` },
  vibe: { question: '¿Qué ritmo buscas?', helper: 'Para decidir entre un rincón tranquilo o un lugar con ambiente.' },
  budget: { question: '¿Cuánto quieres gastar?', helper: 'Por persona, cuántas paradas y cualquier detalle extra.' },
};

const SINGLE = { moment: MOMENT_OPTIONS, company: COMPANY_OPTIONS, vibe: VIBE_OPTIONS } as const;
type Option = { value: string; label: string; hint: string };

export const isStepComplete = (draft: Draft, id: StepId) => {
  if (id === 'interests') return draft.interests.length > 0;
  if (id === 'budget') return Boolean(draft.budget && draft.stops);
  return Boolean(draft[id]);
};

function Grid({ options, isSelected, onSelect, isDisabled }: { options: readonly Option[]; isSelected: (value: string) => boolean; onSelect: (value: string) => void; isDisabled?: (value: string) => boolean }) {
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
            onPress={() => {
              tap();
              onSelect(option.value);
            }}
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

type Props = {
  draft: Draft;
  stepIndex: number;
  editing: boolean;
  error: string;
  loading: boolean;
  onDraft: (update: (draft: Draft) => Draft) => void;
  onStep: (index: number) => void;
  onNext: () => void;
  onBack?: () => void;
};

export function Questions({ draft, stepIndex, editing, error, loading, onDraft, onStep, onNext, onBack }: Props) {
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const chooseSingle = (id: keyof typeof SINGLE, value: string) => {
    onDraft((current) => ({ ...current, [id]: value }));
    // Una sola opción: avanza solo para que armar el plan sea tocar y seguir.
    if (!editing && !isLast) setTimeout(() => onStep(stepIndex + 1), 160);
  };

  const toggleInterest = (value: string) => {
    const interest = value as PlanInterest;
    onDraft((current) => {
      if (current.interests.includes(interest)) return { ...current, interests: current.interests.filter((item) => item !== interest) };
      if (current.interests.length >= MAX_INTERESTS) return current;
      return { ...current, interests: [...current.interests, interest] };
    });
  };

  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.stepCount}>{editing ? 'AJUSTANDO TU PLAN' : `PASO ${stepIndex + 1} DE ${STEPS.length}`}</Text>
      <View style={styles.bar}><View style={[styles.barFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} /></View>
      <Text style={styles.question}>{COPY[step].question}</Text>
      <Text style={styles.helper}>{COPY[step].helper}</Text>

      {(step === 'moment' || step === 'company' || step === 'vibe') && (
        <Grid options={SINGLE[step]} isSelected={(value) => draft[step] === value} onSelect={(value) => chooseSingle(step, value)} />
      )}
      {step === 'interests' && (
        <Grid
          options={INTEREST_OPTIONS}
          isSelected={(value) => draft.interests.includes(value as PlanInterest)}
          isDisabled={(value) => !draft.interests.includes(value as PlanInterest) && draft.interests.length >= MAX_INTERESTS}
          onSelect={toggleInterest}
        />
      )}
      {step === 'budget' && (
        <>
          <Grid options={BUDGET_OPTIONS} isSelected={(value) => draft.budget === value} onSelect={(value) => onDraft((current) => ({ ...current, budget: value as Draft['budget'] }))} />
          <Text style={styles.stepCount}>PARADAS</Text>
          <View style={styles.stops}>
            {STOP_OPTIONS.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: draft.stops === value }}
                onPress={() => {
                  tap();
                  onDraft((current) => ({ ...current, stops: value }));
                }}
                style={[styles.stopChip, draft.stops === value && styles.optionActive]}
              >
                <Text style={[styles.optionLabel, draft.stops === value && { color: colors.white }]}>{value}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.stepCount}>¿ALGO MÁS? <Text style={{ color: colors.muted }}>OPCIONAL</Text></Text>
          <TextInput
            value={draft.note}
            onChangeText={(note) => onDraft((current) => ({ ...current, note }))}
            placeholder="Ej. sin alcohol, que acepte mascotas…"
            placeholderTextColor="#8a8794"
            maxLength={MAX_NOTE_LENGTH}
            multiline
            style={styles.note}
            accessibilityLabel="Algo más para tu plan"
          />
        </>
      )}

      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <View style={styles.actions}>
        {stepIndex > 0 && !editing && (
          <Pressable accessibilityRole="button" accessibilityLabel="Paso anterior" onPress={() => onStep(stepIndex - 1)} style={styles.back}>
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
        )}
        {editing && onBack && <Button label="VOLVER" variant="secondary" onPress={onBack} style={{ flex: 1 }} />}
        <Button
          label={editing ? 'ACTUALIZAR' : isLast ? 'ARMAR MI PLAN' : 'SIGUIENTE'}
          icon={editing ? RefreshCw : isLast ? Sparkles : ArrowRight}
          onPress={onNext}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepCount: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  bar: { height: 4, backgroundColor: colors.lineDark },
  barFill: { height: 4, backgroundColor: colors.ink },
  question: { color: colors.ink, fontFamily: fonts.display, fontSize: 30, lineHeight: 31, letterSpacing: -1 },
  helper: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { width: '48.5%', minHeight: 80, padding: 12, gap: 4, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink },
  optionActive: { backgroundColor: colors.ink },
  optionLabel: { color: colors.ink, fontFamily: fonts.display, fontSize: 16 },
  optionHint: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  stops: { flexDirection: 'row', gap: 8 },
  stopChip: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  note: { minHeight: 64, padding: 12, color: colors.ink, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink, fontFamily: fonts.body, fontSize: 16, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  back: { width: 54, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
});
