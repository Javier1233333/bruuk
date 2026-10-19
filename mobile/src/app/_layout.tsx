import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

// Solo vertical. app.json ya lo pide; esto lo asegura también en Expo Go.
void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const [fontsLoaded] = useFonts({ Outfit_800ExtraBold, Outfit_900Black, DMSans_400Regular, DMSans_700Bold });
  const { user, loading } = useAuth();

  if (!fontsLoaded || loading) {
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
        {/* Sin sesión solo existe el login; al entrar o salir el guard cambia de pantalla solo */}
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="lugar/[id]" options={{ title: '' }} />
          <Stack.Screen name="atardeceres" options={{ title: 'Atardeceres' }} />
          <Stack.Screen name="sube-un-spot" options={{ title: 'Sube un spot' }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
