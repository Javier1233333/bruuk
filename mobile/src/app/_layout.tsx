import { useEffect } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Updates from 'expo-updates';
import { useFonts, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Download } from 'lucide-react-native';
import { Button, Logo } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';
import { ContentProvider, useContent } from '../lib/content';
import { APP_VERSION, isOlder } from '../lib/version';
import { colors, fonts } from '../theme';

// Solo vertical. app.json ya lo pide; esto lo asegura también en Expo Go.
void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);

// Cambios de código publicados con `eas update`: se bajan al abrir y se aplican al siguiente arranque.
function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    Updates.checkForUpdateAsync()
      .then((result) => (result.isAvailable ? Updates.fetchUpdateAsync() : null))
      .catch(() => undefined);
  }, []);
}

export default function RootLayout() {
  useOtaUpdates();
  return (
    <ContentProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ContentProvider>
  );
}

function RootNavigator() {
  const [fontsLoaded] = useFonts({ Outfit_800ExtraBold, Outfit_900Black, DMSans_400Regular, DMSans_700Bold });
  const { user, loading } = useAuth();
  const { config } = useContent();

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.violet} />
      </View>
    );
  }

  // meta/app.minVersion: cuando una versión vieja ya no sirve, se pide actualizar.
  if (isOlder(APP_VERSION, config.minVersion)) {
    return (
      <View style={[styles.center, styles.update]}>
        <StatusBar style="light" />
        <Logo size={40} />
        <Text style={styles.updateTitle}>ACTUALIZA{'\n'}<Text style={{ color: colors.violet }}>BRUUK.</Text></Text>
        <Text style={styles.updateBody}>Esta versión ({APP_VERSION}) ya no es compatible. Baja la nueva desde la tienda para seguir explorando.</Text>
        <Button label="ACTUALIZAR" icon={Download} variant="accent" onPress={() => void Linking.openURL(Platform.OS === 'ios' ? config.links.ios : config.links.android)} style={{ alignSelf: 'stretch' }} />
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
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        {/* Sin sesión solo existe el login; al entrar o salir el guard cambia de pantalla solo */}
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="lugar/[id]" options={{ title: '' }} />
          <Stack.Screen name="atardeceres" options={{ title: 'Atardeceres' }} />
          <Stack.Screen name="sube-un-spot" options={{ title: 'Sube un spot', presentation: 'modal' }} />
          <Stack.Screen name="cuenta" options={{ title: 'Tu cuenta' }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  update: { alignItems: 'flex-start', gap: 18, padding: 24 },
  updateTitle: { color: colors.paper, fontFamily: fonts.display, fontSize: 52, lineHeight: 50, letterSpacing: -2 },
  updateBody: { color: colors.muted, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
});
