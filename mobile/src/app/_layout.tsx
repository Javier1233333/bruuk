import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { ActivityIndicator, View } from 'react-native';
import { colors, fonts } from '../theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Outfit_800ExtraBold, Outfit_900Black, DMSans_400Regular, DMSans_700Bold });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.violet} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.paper,
          headerTitleStyle: { fontFamily: fonts.heading },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lugar/[id]" options={{ title: '' }} />
        <Stack.Screen name="atardeceres" options={{ title: 'Atardeceres' }} />
        <Stack.Screen name="sube-un-spot" options={{ title: 'Sube un spot' }} />
      </Stack>
    </>
  );
}
