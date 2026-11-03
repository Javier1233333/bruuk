import { Pressable, Share, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowUpRight, Flame, MapPin, Share2, Star } from 'lucide-react-native';
import { imageUri, shareUrlFor, type PlanPlace } from '../lib/catalog';
import { accentFor, placeVisual } from '../lib/visual';
import { colors, fonts } from '../theme';
import { ShadowBox, openUrl, tap } from './ui';

// Foto real o, si no hay, el ícono de su categoría sobre su color (como en la web).
export function PlaceThumb({ place, size, style }: { place: PlanPlace; size?: number; style?: StyleProp<ViewStyle & ImageStyle> }) {
  const uri = imageUri(place);
  const { Icon } = placeVisual(place);
  const accent = accentFor(place);
  const box: ViewStyle & ImageStyle = size ? { width: size, height: size } : { width: '100%', aspectRatio: 4 / 3 };
  if (uri) return <Image source={{ uri }} style={[box, { backgroundColor: colors.lilac }, style as StyleProp<ImageStyle>]} contentFit="cover" transition={180} accessibilityIgnoresInvertColors />;
  return (
    <View style={[box, styles.thumbEmpty, { backgroundColor: accent }, style]}>
      <Icon size={size ? size * 0.42 : 64} color={colors.ink} strokeWidth={1.8} />
    </View>
  );
}

export const sharePlace = (place: PlanPlace) => {
  tap();
  void Share.share({ message: `${place.name} en Bruuk: ${shareUrlFor(place)}` }).catch(() => undefined);
};

type Props = { place: PlanPlace; hotspotOf?: number; compact?: boolean };

export function SpotCard({ place, hotspotOf, compact = false }: Props) {
  const { label, Icon } = placeVisual(place);
  const accent = accentFor(place);
  return (
    <ShadowBox offset={5} color={colors.ink} style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${place.type}`}
        onPress={() => router.push(`/lugar/${encodeURIComponent(place.id)}`)}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      >
        <View style={[styles.stripe, { backgroundColor: accent }]} />
        {!compact && (
          <View>
            <PlaceThumb place={place} />
            <View style={styles.badge}>
              <Icon size={16} color={colors.ink} strokeWidth={2.2} />
            </View>
            {place.hotspot ? (
              <View style={styles.hotspot}>
                <Flame size={13} color={colors.white} strokeWidth={2.6} />
                <Text style={styles.hotspotText}>HOTSPOT DE LA SEMANA · {place.hotspot}/{hotspotOf ?? 3}</Text>
              </View>
            ) : null}
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.meta}>
            <Text style={[styles.pill, { backgroundColor: accent }]}>{place.type.toUpperCase()}</Text>
            {place.zoneName ? (
              <View style={styles.zone}>
                <MapPin size={11} color={colors.mutedDark} strokeWidth={2.4} />
                <Text style={styles.zoneText}>{place.zoneName.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.name}>{place.name}</Text>
          {place.tip ? (
            <Text style={styles.tip} numberOfLines={compact ? 2 : 3}>
              <Text style={styles.tipLabel}>VE POR  </Text>
              {place.tip}
            </Text>
          ) : null}
          {(place.rating || place.price) && (
            <View style={styles.facts}>
              {place.rating ? (
                <View style={styles.fact}>
                  <Star size={13} color={colors.ink} fill={colors.ink} />
                  <Text style={styles.factText}>{place.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              {place.price ? <Text style={styles.factText}>{place.price}</Text> : null}
              <Text style={styles.category}>{label}</Text>
            </View>
          )}
          <View style={styles.actions}>
            <Pressable accessibilityRole="link" hitSlop={6} onPress={() => openUrl(place.mapsUrl)} style={styles.action}>
              <Text style={styles.actionText}>VER EN MAPS</Text>
              <ArrowUpRight size={15} color={colors.ink} strokeWidth={2.6} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Compartir ${place.name}`} hitSlop={6} onPress={() => sharePlace(place)} style={styles.action}>
              <Share2 size={15} color={colors.violetDeep} strokeWidth={2.4} />
              <Text style={[styles.actionText, { color: colors.violetDeep }]}>COMPARTIR</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </ShadowBox>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  card: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, overflow: 'hidden' },
  stripe: { height: 6 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', left: 10, bottom: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink },
  hotspot: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.ink },
  hotspotText: { color: colors.white, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.2 },
  body: { padding: 14, gap: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, color: colors.ink, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.1, overflow: 'hidden' },
  zone: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoneText: { color: colors.mutedDark, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.1 },
  name: { color: colors.ink, fontFamily: fonts.display, fontSize: 24, lineHeight: 26, letterSpacing: -0.6 },
  tip: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  tipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.5 },
  facts: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  factText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13 },
  category: { marginLeft: 'auto', color: colors.mutedDark, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 2, borderTopWidth: 1.5, borderColor: colors.lineDark },
  action: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.2 },
});
