import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, Check, Dices, Pencil, RefreshCw, Share2, Shuffle } from 'lucide-react-native';
import type { CustomPlan } from '../../lib/catalog';
import { useContent } from '../../lib/content';
import { colors, fonts } from '../../theme';
import { PlaceThumb } from '../SpotCard';
import { Button, ErrorNote, openUrl } from '../ui';

type Props = {
  plan: CustomPlan;
  mode: 'ruleta' | 'preguntas';
  // Lo que salió en la ruleta: las paradas que no están aquí las cambió la IA.
  spunIds: string[];
  summary: { label: string; step: number }[];
  error: string;
  sharing: boolean;
  swappingIndex: number | null;
  busy: boolean;
  onShare: () => void;
  onSwap: (index: number) => void;
  onEdit: (step: number) => void;
  onRespin: () => void;
  onRethread: () => void;
  onAgain: () => void;
};

export function PlanResult({ plan, mode, spunIds, summary, error, sharing, swappingIndex, busy, onShare, onSwap, onEdit, onRespin, onRethread, onAgain }: Props) {
  const { getPlace } = useContent();
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.kickerRow}>
        <Check size={14} color={colors.violetDeep} strokeWidth={3} />
        <Text style={styles.kicker}>TU PLAN</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">{plan.title.toUpperCase()}</Text>
      {plan.thread ? (
        <View style={styles.thread}>
          <Text style={styles.threadLabel}>EL HILO</Text>
          <Text style={styles.threadText}>{plan.thread}</Text>
        </View>
      ) : null}
      {plan.intro ? <Text style={styles.intro}>{plan.intro}</Text> : null}

      {mode === 'preguntas' && summary.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={styles.kicker}>AJUSTA UNA OPCIÓN</Text>
          <View style={styles.adjust}>
            {summary.map((item) => (
              <Pressable key={item.label} accessibilityRole="button" onPress={() => onEdit(item.step)} style={styles.adjustChip}>
                <Text style={styles.adjustText}>{item.label.toUpperCase()}</Text>
                <Pencil size={11} color={colors.ink} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {plan.stops.map((stop, index) => {
        const place = getPlace(stop.placeId);
        if (!place) return null;
        const changedByAi = mode === 'ruleta' && spunIds.length > 0 && !spunIds.includes(stop.placeId);
        return (
          <View key={stop.placeId} style={[styles.stop, swappingIndex === index && { opacity: 0.45 }]}>
            <View style={styles.marker}>
              <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
              {stop.time ? <Text style={styles.time}>{stop.time}</Text> : null}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <PlaceThumb place={place} style={styles.thumb} />
              <Text style={styles.type}>{place.type.toUpperCase()}{place.price ? ` · ${place.price}` : ''}{place.zoneName ? ` · ${place.zoneName.toUpperCase()}` : ''}</Text>
              <Pressable accessibilityRole="link" onPress={() => router.push(`/lugar/${encodeURIComponent(place.id)}`)}>
                <Text style={styles.name}>{place.name}</Text>
              </Pressable>
              {changedByAi && <Text style={styles.changed}>LA IA LA CAMBIÓ PARA QUE ENCAJE</Text>}
              {stop.why ? <Text style={styles.why}>{stop.why}</Text> : null}
              {place.tip ? (
                <View style={styles.tip}>
                  <Text style={styles.tipText}><Text style={styles.tipLabel}>VE POR  </Text>{place.tip}</Text>
                  <Text style={styles.tipSource}>Recomendación de la guía Bruuk</Text>
                </View>
              ) : null}
              <View style={styles.links}>
                <Pressable accessibilityRole="link" onPress={() => openUrl(place.mapsUrl)} style={styles.link} hitSlop={4}>
                  <Text style={styles.linkText}>CÓMO LLEGAR</Text>
                  <ArrowUpRight size={14} color={colors.ink} />
                </Pressable>
                {mode === 'preguntas' && (
                  <Pressable accessibilityRole="button" onPress={() => onSwap(index)} disabled={swappingIndex !== null} style={styles.link} hitSlop={4}>
                    <Shuffle size={14} color={colors.violetDeep} />
                    <Text style={[styles.linkText, { color: colors.violetDeep }]}>{swappingIndex === index ? 'BUSCANDO…' : 'CAMBIAR'}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {plan.closing ? <Text style={styles.closing}>{plan.closing}</Text> : null}
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <Button label={sharing ? 'CREANDO IMAGEN…' : 'COMPARTIR PLAN'} icon={Share2} variant="accent" onPress={onShare} loading={sharing} />
      {mode === 'ruleta' ? (
        <>
          <Button label="VOLVER A GIRAR" icon={Dices} onPress={onRespin} disabled={busy} />
          <Button label="OTRO HILO, MISMOS LUGARES" icon={RefreshCw} variant="secondary" onPress={onRethread} loading={busy} />
        </>
      ) : (
        <>
          <Button label="OTRO PLAN" icon={RefreshCw} onPress={onAgain} loading={busy} disabled={swappingIndex !== null} />
          <Button label="CAMBIAR OPCIONES" icon={Pencil} variant="secondary" onPress={() => onEdit(0)} />
        </>
      )}
      <Text style={styles.note}>La IA ordena el plan; los lugares y las recomendaciones salen de la guía Bruuk. Revisa horarios antes de salir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  title: { color: colors.ink, fontFamily: fonts.display, fontSize: 32, lineHeight: 32, letterSpacing: -1.2 },
  thread: { padding: 12, gap: 4, backgroundColor: colors.ink },
  threadLabel: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.6 },
  threadText: { color: colors.paper, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21 },
  intro: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  adjust: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  adjustChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingHorizontal: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink },
  adjustText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 11 },
  stop: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1.5, borderColor: colors.ink },
  marker: { width: 46, gap: 4 },
  number: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  time: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11 },
  thumb: { borderWidth: 1.5, borderColor: colors.ink, aspectRatio: 16 / 10 },
  type: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.3 },
  name: { color: colors.ink, fontFamily: fonts.display, fontSize: 21, lineHeight: 23, textDecorationLine: 'underline', textDecorationColor: colors.violet },
  changed: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, color: colors.ink, backgroundColor: colors.violetSoft, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.2, overflow: 'hidden' },
  why: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  tip: { padding: 10, gap: 4, backgroundColor: colors.lilac },
  tipText: { color: colors.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  tipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  tipSource: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 11 },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.2 },
  closing: { paddingTop: 14, borderTopWidth: 1.5, borderColor: colors.ink, color: colors.ink, fontFamily: fonts.heading, fontSize: 16, lineHeight: 22 },
  note: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
});
