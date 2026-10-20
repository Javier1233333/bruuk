import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Body, Button, Kicker, Logo, openUrl } from '../components/ui';
import { SITE_URL } from '../lib/catalog';
import { auth, emailActionSettings } from '../lib/firebase';
import { authErrorMessage } from '../lib/auth';
import { colors, fonts, space } from '../theme';

type Mode = 'login' | 'signup';

// Al entrar, el guard de _layout manda a las pestañas; no hace falta navegar aquí.
export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const submit = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const created = await createUserWithEmailAndPassword(auth, email.trim(), password);
        sendEmailVerification(created.user, emailActionSettings).catch(() => {});
      }
    } catch (submitError) {
      setError(authErrorMessage(submitError));
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    setError('');
    setNotice('');
    const target = email.trim();
    if (!target) return setError('Escribe tu correo y te mandamos un enlace para cambiar tu contraseña.');
    const sent = `Si ${target} tiene cuenta, te llegará un correo para cambiar tu contraseña.`;
    try {
      await sendPasswordResetEmail(auth, target, emailActionSettings);
      setNotice(sent);
    } catch (resetError) {
      // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados
      if ((resetError as { code?: string })?.code === 'auth/user-not-found') setNotice(sent);
      else setError(authErrorMessage(resetError));
    }
  };

  const isLogin = mode === 'login';
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo size={30} />

          <View style={styles.intro}>
            <Kicker>/ BRUUK · GUADALAJARA</Kicker>
            <Text style={styles.headline}>
              {isLogin ? 'ENTRA.' : 'ÚNETE.'}{'\n'}<Text style={{ color: colors.violet }}>SAL.</Text>
            </Text>
            <Body>{isLogin ? 'Inicia sesión para seguir explorando spots, vintage y planes en Guadalajara.' : 'Crea tu cuenta con tu correo. Toma menos de un minuto.'}</Body>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs} accessibilityRole="tablist">
              {(['login', 'signup'] as const).map((tab, index) => (
                <Pressable
                  key={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === tab }}
                  onPress={() => switchMode(tab)}
                  style={[styles.tab, index > 0 && styles.tabDivider, mode === tab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, mode === tab && { color: colors.white }]}>{tab === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="#8a8794"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View>
                <TextInput
                  style={[styles.input, { paddingRight: 52 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                  placeholderTextColor="#8a8794"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  textContentType={isLogin ? 'password' : 'newPassword'}
                  editable={!loading}
                  onSubmitEditing={() => void submit()}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.eye}
                  hitSlop={8}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.mutedDark} />
                </Pressable>
              </View>
              {isLogin && (
                <Pressable accessibilityRole="button" onPress={() => void forgotPassword()} style={styles.forgot} hitSlop={8}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
              )}
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}
            {!!notice && <Text style={styles.notice}>{notice}</Text>}

            <Button
              label={loading ? 'PROCESANDO…' : isLogin ? 'ENTRAR' : 'CREAR CUENTA'}
              icon="arrow-right"
              onPress={() => void submit()}
              disabled={loading || !email.trim() || password.length < 6}
            />
            {!isLogin && (
              <Text style={styles.legal}>
                Al crear tu cuenta aceptas el <Text style={styles.legalLink} onPress={() => openUrl(`${SITE_URL}/privacidad`)}>aviso de privacidad</Text>.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingTop: 20, paddingBottom: 48, gap: 22 },
  intro: { gap: 10 },
  headline: { color: colors.paper, fontFamily: fonts.display, fontSize: 60, lineHeight: 54, paddingTop: 8, letterSpacing: -3 },
  card: { gap: 16, padding: 18, backgroundColor: colors.paper, shadowColor: colors.violet, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  tabs: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.ink, marginBottom: 4 },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  tabDivider: { borderLeftWidth: 1.5, borderColor: colors.ink },
  tabActive: { backgroundColor: colors.ink },
  tabText: { color: colors.ink, fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.4 },
  field: { gap: 7 },
  label: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.6 },
  input: { minHeight: 54, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink, fontFamily: fonts.body, fontSize: 16 },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  forgot: { alignSelf: 'flex-end' },
  forgotText: { color: colors.violetDeep, fontFamily: fonts.bodyBold, fontSize: 13, textDecorationLine: 'underline' },
  error: { padding: 12, color: colors.white, backgroundColor: colors.error, fontFamily: fonts.body },
  notice: { padding: 12, color: colors.ink, backgroundColor: colors.lilac, borderLeftWidth: 4, borderColor: colors.violet, fontFamily: fonts.body },
  legal: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
  legalLink: { color: colors.ink, textDecorationLine: 'underline' },
});
