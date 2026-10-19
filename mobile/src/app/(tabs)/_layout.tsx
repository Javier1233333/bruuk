import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

const icon = (name: keyof typeof Feather.glyphMap) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} color={typeof color === 'string' ? color : colors.muted} size={size - 2} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.violet,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 0.6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('compass') }} />
      <Tabs.Screen name="comer" options={{ title: 'Comer', tabBarIcon: icon('coffee') }} />
      <Tabs.Screen name="rack" options={{ title: 'Rack', tabBarIcon: icon('shopping-bag') }} />
      <Tabs.Screen name="plan" options={{ title: 'Tu plan', tabBarIcon: icon('zap') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icon('menu') }} />
    </Tabs>
  );
}
