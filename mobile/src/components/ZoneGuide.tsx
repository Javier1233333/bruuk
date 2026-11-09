import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, MapPin } from 'lucide-react-native';
import type { PlanPlace } from '../lib/catalog';
import type { AppZone } from '../lib/content';
import { colors, fonts } from '../theme';
import { PlaceThumb } from './SpotCard';
import { ShadowBox, tap } from './ui';

// Fila de zonas para explorar (Inicio y Rack): "Todas" + las 7 zonas de Bruuk.
export function ZoneChips({ zones, value, onChange }: { zones: AppZone[]; value: string | null; onChange: (zoneId: string | null) => void }) {
  const options = zones.filter((zone) => zone.value !== 'toda');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Explorar por zona">
      {[{ value: null, label: 'TODAS', color: undefined }, ...options.map((zone) => ({ value: zone.value, label: zone.label.toUpperCase(), color: zone.color }))].map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value ?? 'todas'}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => {
              tap();
              onChange(option.value);
            }}
            style={[styles.chip, selected && { backgroundColor: option.color ?? colors.violet, borderColor: option.color ?? colors.violet }]}
          >
            {option.value ? <View style={[styles.dot, { backgroundColor: option.color ?? colors.violet }, selected && { backgroundColor: colors.ink }]} /> : <MapPin size={13} color={selected ? colors.ink : colors.paper} />}
            <Text style={[styles.chipText, selected && { color: colors.ink }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Guía de una zona: el texto y el top que se curan en /admin/spots → Zonas.
export function ZoneGuide({ zone, picks, total }: { zone: AppZone; picks: PlanPlace[]; total: number }) {
  const color = zone.color ?? colors.violet;
  return (
    <ShadowBox offset={6} color={color}>
      <View style={styles.card}>
        <View style={styles.head}>
          <MapPin size={15} color={colors.violetDeep} strokeWidth={2.6} />
          <Text style={styles.kicker}>/ ZONA</Text>
        </View>
        <Text style={styles.title}>{zone.hint.toUpperCase()}</Text>
        <Text style={styles.lead}>{zone.intro || `${total} ${total === 1 ? 'lugar' : 'lugares'} de la guía en esta zona.`}</Text>
        {picks.length > 0 && <Text style={styles.topLabel}>EL TOP DE {zone.label.toUpperCase()}</Text>}
        {picks.map((place, index) => (
          <Pressable key={place.id} accessibilityRole="button" onPress={() => router.push(`/lugar/${encodeURIComponent(place.id)}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <Text style={[styles.rank, { color }]}>{index + 1}</Text>
            <PlaceThumb place={place} size={48} style={styles.thumb} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
              <Text style={styles.tip} numberOfLines={2}>{place.tip ?? place.type}</Text>
            </View>
            <ChevronRight size={18} color={colors.ink} />
          </Pressable>
        ))}
      </View>
    </ShadowBox>
  );
}

// El top curado primero (en su orden) y luego el resto de la zona.
export function orderByZone<T extends { id: string; zone?: string }>(items: T[], zone: AppZone | null) {
  if (!zone) return items;
  const inZone = items.filter((item) => item.zone === zone.value);
  const picks = (zone.picks ?? []).map((id) => inZone.find((item) => item.id === id)).filter((item): item is T => Boolean(item));
  return [...picks, ...inZone.filter((item) => !picks.includes(item))];
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingRight: 8 },
  chip: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.line },
  dot: { width: 9, height: 9, borderRadius: 5 },
  chipText: { color: colors.paper, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.9 },
  card: { padding: 16, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  title: { marginTop: 8, color: colors.ink, fontFamily: fonts.display, fontSize: 28, lineHeight: 29, letterSpacing: -1 },
  lead: { marginTop: 6, marginBottom: 6, color: colors.mutedDark, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  topLabel: { marginTop: 4, marginBottom: 4, color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1.5, borderColor: colors.lineDark },
  rank: { width: 18, fontFamily: fonts.display, fontSize: 18 },
  thumb: { borderWidth: 1.5, borderColor: colors.ink },
  name: { color: colors.ink, fontFamily: fonts.display, fontSize: 15 },
  tip: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
});
