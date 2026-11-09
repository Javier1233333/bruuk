import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { router } from 'expo-router';
import { BookHeart, Dices, House, Plus, Shirt, type LucideIcon } from 'lucide-react-native';
import { tap } from '../../components/ui';
import { useContent } from '../../lib/content';
import { colors, fonts } from '../../theme';

// Las mismas pestañas que el modo app de la web (src/components/AppTabBar.tsx).
const icon = (Icon: LucideIcon) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View style={styles.iconWrap}>
        {focused && <View style={styles.activeBar} />}
        <Icon size={22} color={focused ? colors.violetSoft : typeof color === 'string' ? color : colors.tabInactive} strokeWidth={focused ? 2.4 : 2} />
      </View>
    );
  };

// El "+" del centro no es una pantalla: abre Sube un spot encima de todo.
function SpotButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sube un spot"
      onPress={() => {
        tap();
        router.push('/sube-un-spot');
      }}
      style={({ pressed }) => [styles.spotButton, pressed && { opacity: 0.72 }]}
    >
      <View style={styles.spotBubble}>
        <Plus size={20} color={colors.ink} strokeWidth={2.8} />
      </View>
      <Text style={styles.spotLabel}>SPOT</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { config } = useContent();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.paper,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.line, borderTopWidth: 1.5 },
        tabBarLabelStyle: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
      }}
      screenListeners={{ tabPress: () => tap() }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon(House) }} />
      <Tabs.Screen name="rack" options={{ title: 'Rack', tabBarIcon: icon(Shirt) }} />
      <Tabs.Screen
        name="spot"
        options={config.features.subirSpot ? { title: 'Spot', tabBarButton: () => <SpotButton /> } : { href: null }}
      />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: icon(Dices), href: config.features.ruleta || config.features.preguntas ? undefined : null }} />
      <Tabs.Screen name="momentos" options={{ title: 'Momentos', tabBarIcon: icon(BookHeart), href: config.features.momentos ? undefined : null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 40, height: 28 },
  activeBar: { position: 'absolute', top: -9, width: 28, height: 3, backgroundColor: colors.violet },
  spotButton: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 3, paddingTop: 5 },
  spotBubble: { width: 40, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violet, borderWidth: 1.5, borderColor: colors.paper },
  spotLabel: { color: colors.tabInactive, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1 },
});
