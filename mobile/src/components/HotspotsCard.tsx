import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Flame } from 'lucide-react-native';
import type { PlanPlace } from '../lib/catalog';
import { colors, fonts } from '../theme';
import { PlaceThumb } from './SpotCard';
import { ShadowBox } from './ui';

// Lunes de la semana en que se publicaron, como en la web: "semana del 2 de noviembre".
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function weekOf(date?: string) {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return `${value.getDate()} de ${MESES[value.getMonth()]}`;
}

export function HotspotsCard({ places, date }: { places: PlanPlace[]; date?: string }) {
  const week = weekOf(date);
  return (
    <ShadowBox offset={6}>
      <View style={styles.card}>
        <View style={styles.head}>
          <Flame size={16} color={colors.violetDeep} strokeWidth={2.6} />
          <Text style={styles.kicker}>/ HOTSPOTS DE LA SEMANA</Text>
        </View>
        <Text style={styles.title}>{places.length === 1 ? 'UN SPOT.' : `${places.length === 2 ? 'DOS' : 'TRES'} SPOTS.`}{'\n'}ESTA SEMANA.</Text>
        <Text style={styles.lead}>Elegidos a mano por Bruuk{week ? ` · semana del ${week}` : ''}</Text>
        {places.map((place, index) => (
          <Pressable
            key={place.id}
            accessibilityRole="button"
            onPress={() => router.push(`/lugar/${encodeURIComponent(place.id)}`)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.rank}>{index + 1}</Text>
            <PlaceThumb place={place} size={52} style={styles.thumb} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
              <Text style={styles.tip} numberOfLines={2}>
                {place.tip ? <><Text style={styles.tipLabel}>VE POR </Text>{place.tip}</> : [place.type, place.zoneName].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.ink} />
          </Pressable>
        ))}
      </View>
    </ShadowBox>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  title: { marginTop: 8, color: colors.ink, fontFamily: fonts.display, fontSize: 30, lineHeight: 30, letterSpacing: -1 },
  lead: { marginTop: 6, marginBottom: 8, color: colors.mutedDark, fontFamily: fonts.body, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1.5, borderColor: colors.lineDark },
  rank: { width: 20, color: colors.ink, fontFamily: fonts.display, fontSize: 20 },
  thumb: { borderWidth: 1.5, borderColor: colors.ink },
  name: { color: colors.ink, fontFamily: fonts.display, fontSize: 16 },
  tip: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  tipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.2 },
});
