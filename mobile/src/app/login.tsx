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
import { Body, Button, Kicker, Logo, Title } from '../components/ui';
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
          <Logo size={38} />

          <View style={styles.tabs}>
            {(['login', 'signup'] as const).map((tab) => (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === tab }}
                onPress={() => switchMode(tab)}
                style={[styles.tab, mode === tab && styles.tabActive]}
              >
                <Text style={[styles.tabText, mode === tab && { color: colors.ink }]}>{tab === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}</Text>
              </Pressable>
            ))}
          </View>

          <Kicker>{isLogin ? '/ BIENVENIDO DE VUELTA' : '/ ÚNETE AL MOVIMIENTO'}</Kicker>
          <Title>{isLogin ? 'Sigue explorando.' : 'Sal a explorar.'}</Title>
          <Body>{isLogin ? 'Inicia sesión para usar Bruuk.' : 'Crea tu cuenta con tu correo.'}</Body>

          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View>
              <TextInput
                style={[styles.input, { paddingRight: 52 }]}
                value={password}
                onChangeText={setPassword}
                placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                placeholderTextColor={colors.muted}
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
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingTop: 32, paddingBottom: 48, gap: 16 },
  tabs: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.paper, marginTop: 8 },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.violet },
  tabText: { color: colors.paper, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1.2 },
  field: { gap: 8 },
  label: { color: colors.paper, fontFamily: fonts.heading, fontSize: 16 },
  input: { minHeight: 52, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.paper, fontFamily: fonts.body, fontSize: 16 },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  forgot: { alignSelf: 'flex-end' },
  forgotText: { color: colors.violetSoft, fontFamily: fonts.bodyBold, fontSize: 13 },
  error: { padding: 12, color: colors.white, backgroundColor: colors.error, fontFamily: fonts.body },
  notice: { padding: 12, color: colors.ink, backgroundColor: colors.lilac, fontFamily: fonts.body },
  submit: { backgroundColor: colors.violet, borderColor: colors.violet, marginTop: 4 },
});
