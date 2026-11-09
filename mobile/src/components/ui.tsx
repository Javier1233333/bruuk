import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts, space } from '../theme';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <Text style={[styles.logo, { fontSize: size }]} accessibilityRole="header" accessibilityLabel="Bruuk">
      bruuk<Text style={{ color: colors.violet }}>.</Text>
    </Text>
  );
}

type ScreenProps = { children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; contentStyle?: StyleProp<ViewStyle> };

export function Screen({ children, scroll = true, onRefresh, refreshing = false, contentStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function Kicker({ children, dark = false, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.kicker, dark && { color: colors.violetDeep }, style]}>{children}</Text>;
}

export function Title({ children, accent, dark = false, size = 38 }: { children: ReactNode; accent?: string; dark?: boolean; size?: number }) {
  return (
    <Text style={[styles.title, { fontSize: size, lineHeight: size * 0.98 }, dark && { color: colors.ink }]} accessibilityRole="header">
      {children}
      {accent ? <Text style={{ color: colors.violet }}>{'\n'}{accent}</Text> : null}
    </Text>
  );
}

export function Body({ children, dark = false, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, dark && { color: colors.mutedDark }, style]}>{children}</Text>;
}

type ChipProps = { label: string; active?: boolean; onPress: () => void; disabled?: boolean; icon?: LucideIcon; dark?: boolean };

export function Chip({ label, active, onPress, disabled, icon: Icon, dark = false }: ChipProps) {
  const color = active ? colors.ink : dark ? colors.ink : colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [styles.chip, dark && { borderColor: colors.ink }, active && styles.chipActive, (disabled || pressed) && { opacity: disabled ? 0.35 : 0.72 }]}
    >
      {Icon && <Icon size={14} color={color} strokeWidth={2.4} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon: Icon, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const palette = {
    primary: { bg: colors.ink, border: colors.ink, text: colors.white, shadow: true },
    accent: { bg: colors.violet, border: colors.violet, text: colors.ink, shadow: false },
    secondary: { bg: 'transparent', border: colors.ink, text: colors.ink, shadow: false },
    ghost: { bg: 'transparent', border: 'rgba(255,255,255,0.5)', text: colors.paper, shadow: false },
  }[variant];
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (pressed || disabled) && { opacity: disabled ? 0.55 : 0.85 },
        !palette.shadow && style,
      ]}
    >
      {loading ? <ActivityIndicator color={palette.text} /> : <Text style={[styles.buttonText, { color: palette.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>}
      {!loading && Icon && <Icon size={17} color={palette.text} strokeWidth={2.6} />}
    </Pressable>
  );
  return palette.shadow ? <ShadowBox style={style}>{button}</ShadowBox> : button;
}

// Sombra violeta desplazada del diseño Bruuk. Android no pinta sombras de color, así que
// se dibuja como un bloque detrás del contenido en las dos plataformas.
export function ShadowBox({ children, offset = 4, color = colors.violet, style }: { children: ReactNode; offset?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', top: offset, left: offset, right: -offset, bottom: -offset, backgroundColor: color }} />
      {children}
    </View>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <Text style={styles.error} accessibilityRole="alert">{children}</Text>;
}

export const openUrl = (url: string) => {
  void Linking.openURL(url).catch(() => undefined);
};

// Vibración corta, como navigator.vibrate(8) en la web.
export const tap = () => {
  void Haptics.selectionAsync().catch(() => undefined);
};

const styles = StyleSheet.create({
  logo: { color: colors.paper, fontFamily: fonts.display, letterSpacing: -1.5 },
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { padding: space.gutter, paddingBottom: 40, gap: 14 },
  kicker: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.8 },
  title: { color: colors.paper, fontFamily: fonts.display, letterSpacing: -1.6, textTransform: 'uppercase' },
  body: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  chip: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.paper },
  chipActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1 },
  button: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, borderWidth: 1.5 },
  buttonText: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.3 },
  error: { padding: 12, color: colors.white, backgroundColor: colors.error, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
