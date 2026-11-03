import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Dices, Lock, LockOpen, MapPin, Shuffle, Sparkles } from 'lucide-react-native';
import { INTEREST_OPTIONS, MOMENT_INTERESTS, ROULETTE_MOMENTS, STOP_OPTIONS, type PlanInterest, type PlanPlace } from '../../lib/catalog';
import { useContent } from '../../lib/content';
import { pickSlots, randomItem, roulettePool, type RouletteState } from '../../lib/roulette';
import { INTEREST_ICONS, MOMENT_ICONS, accentFor, placeVisual } from '../../lib/visual';
import { colors, fonts } from '../../theme';
import { PlaceThumb } from '../SpotCard';
import { Button, tap } from '../ui';

const SPIN_TICK_MS = 70;
const SPIN_FIRST_STOP_MS = 650;
const SPIN_STAGGER_MS = 380;

type Props = { state: RouletteState; onChange: (next: RouletteState) => void; onGenerate: () => void; loading: boolean };

export function Roulette({ state, onChange, onGenerate, loading }: Props) {
  const { places, byId, zones } = useContent();
  // Mientras gira, cada casilla muestra lugares al azar hasta detenerse en el resultado.
  const [rolling, setRolling] = useState<(PlanPlace | null)[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduceMotion = useRef(false);
  const pool = roulettePool(places, state);
  const isSpinning = rolling !== null;
  const hasSpun = state.slots.length > 0;
  const busy = isSpinning || loading;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { reduceMotion.current = value; });
    return () => clearTimeout(timer.current);
  }, []);

  const spin = (only?: number) => {
    if (isSpinning) return;
    const base = only === undefined ? state : { ...state, slots: state.slots.map((slot, index) => (index === only ? slot : { ...slot, locked: true })) };
    const picked = pickSlots(places, byId, base).map((slot, index) => ({ ...slot, locked: state.slots[index]?.locked ?? false }));
    const next = { ...state, slots: picked };
    onChange(next);
    if (reduceMotion.current) return;
    const spinning = picked.map((_, index) => !state.slots[index]?.locked && (only === undefined || index === only));
    const stopAt = picked.map((_, index) => SPIN_FIRST_STOP_MS + spinning.slice(0, index).filter(Boolean).length * SPIN_STAGGER_MS);
    const lastStop = Math.max(...stopAt.filter((_, index) => spinning[index]));
    const stopped = new Set<number>();
    let elapsed = 0;
    const tick = () => {
      setRolling(picked.map((_, index) => {
        if (!spinning[index] || elapsed >= stopAt[index]) {
          if (spinning[index] && !stopped.has(index)) {
            stopped.add(index);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          }
          return null;
        }
        return randomItem(pool) ?? null;
      }));
      if (elapsed < lastStop) {
        elapsed += SPIN_TICK_MS;
        timer.current = setTimeout(tick, SPIN_TICK_MS);
      } else {
        setRolling(null);
      }
    };
    tick();
  };

  const toggleLock = (index: number) => {
    tap();
    onChange({ ...state, slots: state.slots.map((slot, position) => (position === index ? { ...slot, locked: !slot.locked } : slot)) });
  };

  const setCount = (count: number) => {
    tap();
    const next = { ...state, count };
    // Al quitar casillas se van primero las que no están fijas.
    if (count < state.slots.length) {
      const locked = state.slots.filter((slot) => slot.locked).slice(0, count);
      const loose = state.slots.filter((slot) => !slot.locked).slice(0, count - locked.length);
      next.slots = state.slots.filter((slot) => locked.includes(slot) || loose.includes(slot));
    } else if (hasSpun) {
      next.slots = pickSlots(places, byId, { ...next, slots: state.slots.map((slot) => ({ ...slot, locked: true })) })
        .map((slot, index) => ({ ...slot, locked: state.slots[index]?.locked ?? false }));
    }
    onChange(next);
  };

  const toggleInterest = (interest: PlanInterest) => {
    tap();
    onChange({ ...state, interests: state.interests.includes(interest) ? state.interests.filter((value) => value !== interest) : [...state.interests, interest] });
  };

  const lockedCount = state.slots.filter((slot) => slot.locked).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.moments} accessibilityRole="radiogroup" accessibilityLabel="¿Cuándo sales?">
        {ROULETTE_MOMENTS.map((option) => {
          const Icon = MOMENT_ICONS[option.value];
          const selected = state.moment === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: busy }}
              disabled={busy}
              onPress={() => {
                tap();
                onChange({ ...state, moment: option.value });
              }}
              style={[styles.moment, selected && styles.momentActive]}
            >
              <Icon size={20} color={selected ? colors.white : colors.ink} strokeWidth={2.2} />
              <Text style={[styles.momentText, selected && { color: colors.white }]}>{option.value === 'sorpresa' ? 'Lo que sea' : option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.zones} accessibilityRole="radiogroup" accessibilityLabel="¿En qué zona?">
        <MapPin size={15} color={colors.ink} strokeWidth={2.4} />
        {zones.map((option) => {
          const selected = state.zone === option.value;
          // Una zona sin lugares suficientes a esa hora no se puede elegir
          const tooFew = roulettePool(places, { ...state, zone: option.value }).length < state.count;
          const disabled = busy || (tooFew && !selected);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              accessibilityHint={tooFew ? 'Pocos lugares a esa hora' : option.hint}
              disabled={disabled}
              onPress={() => {
                tap();
                onChange({ ...state, zone: option.value, slots: state.slots.filter((slot) => slot.locked) });
              }}
              style={[styles.zone, selected && styles.zoneActive, disabled && !selected && { opacity: 0.35 }]}
            >
              <Text style={[styles.zoneText, selected && { color: colors.white }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tools}>
        <View style={styles.interests} accessibilityLabel="Qué entra en la ruleta">
          {INTEREST_OPTIONS.filter((option) => MOMENT_INTERESTS[state.moment].includes(option.value)).map((option) => {
            const Icon = INTEREST_ICONS[option.value];
            const selected = state.interests.includes(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected, disabled: busy }}
                disabled={busy}
                onPress={() => toggleInterest(option.value)}
                style={[styles.iconButton, selected && styles.iconButtonActive]}
              >
                <Icon size={19} color={selected ? colors.white : colors.ink} strokeWidth={2.2} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.count} accessibilityRole="radiogroup" accessibilityLabel="Número de paradas">
          {STOP_OPTIONS.map((value) => {
            const selected = state.count === value;
            const disabled = busy || value < lockedCount;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={`${value} paradas`}
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                onPress={() => setCount(value)}
                style={[styles.countButton, selected && styles.iconButtonActive, disabled && !selected && { opacity: 0.35 }]}
              >
                <Text style={[styles.countText, selected && { color: colors.white }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.slots}>
        {Array.from({ length: state.count }, (_, index) => {
          const slot = state.slots[index];
          const place = rolling?.[index] ?? (slot ? byId.get(slot.placeId) : undefined);
          const isRolling = Boolean(rolling?.[index]);
          const visual = place ? placeVisual(place) : null;
          const Icon = visual?.Icon ?? Dices;
          return (
            <View key={index} style={styles.slotWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: slot?.locked, disabled: busy }}
                accessibilityLabel={!slot ? 'Girar la ruleta' : slot.locked ? `Soltar ${place?.name}` : `Fijar ${place?.name}`}
                disabled={busy || (!slot && pool.length < state.count)}
                onPress={() => (slot ? toggleLock(index) : spin())}
                style={[styles.slot, slot?.locked && styles.slotLocked, !place && styles.slotEmpty]}
              >
                {place ? (
                  <PlaceThumb place={place} style={[styles.slotImage, isRolling && { opacity: 0.6 }]} />
                ) : (
                  <View style={[styles.slotImage, styles.slotArt]}><Dices size={40} color={colors.violetDeep} strokeWidth={1.6} /></View>
                )}
                {place && (
                  <View style={[styles.slotTag, { backgroundColor: accentFor(place) }]}>
                    <Icon size={11} color={colors.ink} strokeWidth={2.6} />
                    <Text style={styles.slotTagText} numberOfLines={1}>{place.type}</Text>
                  </View>
                )}
                <Text style={styles.slotName} numberOfLines={2}>{place ? place.name : '?'}</Text>
                {slot && !isSpinning && (
                  <View style={[styles.lock, slot.locked && styles.lockOn]}>
                    {slot.locked ? <Lock size={14} color={colors.white} /> : <LockOpen size={14} color={colors.ink} />}
                  </View>
                )}
              </Pressable>
              {slot && !slot.locked && !isSpinning && (
                <Pressable accessibilityRole="button" accessibilityLabel={`Volver a girar ${place?.name ?? 'esta parada'}`} onPress={() => spin(index)} disabled={busy} style={styles.respin} hitSlop={6}>
                  <Shuffle size={15} color={colors.ink} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>{hasSpun ? 'Toca una casilla para fijarla. Las fijas no cambian al volver a girar.' : `${pool.length} lugares en la ruleta.`}</Text>

      <View style={styles.actions}>
        {hasSpun ? (
          <>
            <Button label="GIRAR" icon={Dices} variant="secondary" onPress={() => spin()} disabled={busy || lockedCount === state.count} style={{ flex: 1 }} />
            <Button label="ARMAR PLAN" icon={Sparkles} onPress={onGenerate} loading={loading} disabled={isSpinning} style={{ flex: 1.4 }} />
          </>
        ) : (
          <Button label="GIRAR LA RULETA" icon={Dices} onPress={() => spin()} disabled={busy || pool.length < state.count} style={{ flex: 1 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  moments: { flexDirection: 'row', gap: 6 },
  moment: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.white },
  momentActive: { backgroundColor: colors.ink },
  momentText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 0.4 },
  zones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  zone: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.ink },
  zoneActive: { backgroundColor: colors.ink },
  zoneText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  interests: { flexDirection: 'row', gap: 6 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.white },
  iconButtonActive: { backgroundColor: colors.violetDeep, borderColor: colors.violetDeep },
  count: { flexDirection: 'row', gap: 6 },
  countButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  countText: { color: colors.ink, fontFamily: fonts.display, fontSize: 16 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotWrap: { width: '48.4%' },
  slot: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, overflow: 'hidden' },
  slotLocked: { borderColor: colors.violetDeep, borderWidth: 3 },
  slotEmpty: { borderStyle: 'dashed' },
  slotImage: { width: '100%', aspectRatio: 1.1 },
  slotArt: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac },
  slotTag: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3 },
  slotTagText: { flexShrink: 1, color: colors.ink, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' },
  slotName: { minHeight: 44, padding: 8, color: colors.ink, fontFamily: fonts.display, fontSize: 14, lineHeight: 16 },
  lock: { position: 'absolute', right: 8, bottom: 50, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink },
  lockOn: { backgroundColor: colors.violetDeep, borderColor: colors.violetDeep },
  respin: { position: 'absolute', top: -8, right: -8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft, borderWidth: 1.5, borderColor: colors.ink },
  hint: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
});
