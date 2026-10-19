import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, fonts, space } from '../theme';
import { imageUri, type PlanPlace } from '../lib/catalog';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <Text style={[styles.logo, { fontSize: size }]}>
      bruuk<Text style={{ color: colors.violet }}>.</Text>
    </Text>
  );
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView> : children}
    </SafeAreaView>
  );
}

export function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <Text style={[styles.kicker, dark && { color: colors.violetDeep }]}>{children}</Text>;
}

export function Title({ children, accent, dark = false }: { children: ReactNode; accent?: string; dark?: boolean }) {
  return (
    <Text style={[styles.title, dark && { color: colors.ink }]}>
      {children}
      {accent ? <Text style={{ color: colors.violet }}> {accent}</Text> : null}
    </Text>
  );
}

export function Body({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <Text style={[styles.body, dark && { color: colors.mutedDark }]}>{children}</Text>;
}

export function Chip({ label, active, onPress, disabled }: { label: string; active?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, active && styles.chipActive, disabled && { opacity: 0.4 }]}
    >
      <Text style={[styles.chipText, active && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

type ButtonProps = { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; variant?: 'primary' | 'secondary'; disabled?: boolean; style?: StyleProp<ViewStyle> };

export function Button({ label, onPress, icon, variant = 'primary', disabled, style }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, primary ? styles.buttonPrimary : styles.buttonSecondary, (pressed || disabled) && { opacity: 0.7 }, style]}
    >
      <Text style={[styles.buttonText, !primary && { color: colors.ink }]}>{label}</Text>
      {icon && <Feather name={icon} size={17} color={primary ? colors.white : colors.ink} />}
    </Pressable>
  );
}

export const openUrl = (url: string) => {
  void Linking.openURL(url);
};

export function PlaceCard({ place }: { place: PlanPlace }) {
  const uri = imageUri(place);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/lugar/${place.id}`)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      {uri ? <Image source={{ uri }} style={styles.cardImage} contentFit="cover" transition={200} /> : <View style={[styles.cardImage, styles.cardImageEmpty]}><Feather name="map-pin" size={28} color={colors.violet} /></View>}
      <View style={styles.cardBody}>
        <Text style={styles.cardType}>{place.type.toUpperCase()}{place.price ? ` · ${place.price}` : ''}</Text>
        <Text style={styles.cardName}>{place.name}</Text>
        {place.tip && (
          <Text style={styles.cardTip} numberOfLines={2}>
            <Text style={styles.cardTipLabel}>VE POR  </Text>{place.tip}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logo: { color: colors.paper, fontFamily: fonts.display, letterSpacing: -1.5 },
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { padding: space.gutter, paddingBottom: 40, gap: 14 },
  kicker: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.8 },
  title: { color: colors.paper, fontFamily: fonts.display, fontSize: 38, lineHeight: 38, letterSpacing: -1.6, textTransform: 'uppercase' },
  body: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.paper },
  chipActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.paper, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1 },
  button: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, borderWidth: 1.5 },
  buttonPrimary: { backgroundColor: colors.ink, borderColor: colors.ink, shadowColor: colors.violet, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: colors.ink },
  buttonText: { color: colors.white, fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.3 },
  card: { backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.paper },
  cardImage: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.lilac },
  cardImageEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 4 },
  cardType: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.5 },
  cardName: { color: colors.ink, fontFamily: fonts.display, fontSize: 21, letterSpacing: -0.4 },
  cardTip: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  cardTipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.5 },
});
