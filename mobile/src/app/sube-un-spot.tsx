import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ArrowRight, Check, ChevronLeft, LocateFixed, Send } from 'lucide-react-native';
import { Button, Chip, ErrorNote, Kicker, ShadowBox, tap } from '../components/ui';
import { postApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts, space } from '../theme';

type StepId = 'spot' | 'city' | 'location' | 'reason' | 'email';
const STEPS: StepId[] = ['spot', 'city', 'location', 'reason', 'email'];
const CITY_SHORTCUTS = ['Guadalajara', 'Zapopan', 'Tlaquepaque'];
const EMAIL_KEY = 'bruuk-submit-email';
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const COPY: Record<StepId, { question: string; helper: string }> = {
  spot: { question: '¿Cómo se llama el lugar?', helper: 'Una cafetería, tienda, museo, mirador… lo que te guste.' },
  city: { question: '¿En qué ciudad está?', helper: 'Puede ser Guadalajara o cualquier ciudad del mundo.' },
  location: { question: '¿Dónde lo encontramos?', helper: 'Opcional. Un enlace de Google Maps o Instagram, o la dirección.' },
  reason: { question: '¿Por qué te gusta?', helper: 'Cuéntalo como se lo contarías a un amigo: qué pedir, cuándo ir, qué lo hace especial.' },
  email: { question: '¿A dónde te escribimos?', helper: 'Sólo por si necesitamos confirmar algo. Tu correo nunca se publica.' },
};

export default function SubmitSpotScreen() {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({ spot: '', city: '', location: '', reason: '', email: user?.email ?? '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    AsyncStorage.getItem(EMAIL_KEY)
      .then((saved) => saved && setValues((current) => (current.email ? current : { ...current, email: saved })))
      .catch(() => undefined);
  }, []);

  const set = (key: StepId, value: string) => {
    setError('');
    setValues((current) => ({ ...current, [key]: value }));
  };

  const validate = (id: StepId) => {
    if (id === 'spot' && values.spot.trim().length < 2) return 'Escribe el nombre del spot.';
    if (id === 'city' && values.city.trim().length < 2) return 'Escribe la ciudad del spot.';
    if (id === 'reason' && values.reason.trim().length < 10) return 'Cuéntanos un poco más: ¿por qué te gusta este lugar?';
    if (id === 'email' && !EMAIL_PATTERN.test(values.email.trim())) return 'Escribe un correo válido para poder preguntarte si falta algún dato.';
    return '';
  };

  const submit = async () => {
    setStatus('loading');
    try {
      const email = values.email.trim().toLowerCase();
      await postApi('place-proposal', {
        spotName: values.spot.trim(),
        city: values.city.trim(),
        location: values.location.trim(),
        reason: values.reason.trim(),
        email,
      });
      await AsyncStorage.setItem(EMAIL_KEY, email).catch(() => undefined);
      setStatus('success');
    } catch (submitError) {
      setStatus('idle');
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el spot.');
    }
  };

  const next = () => {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    if (isLast) void submit();
    else {
      setStepIndex(stepIndex + 1);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  };

  const locate = async () => {
    setLocating(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('permission');
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set('location', `https://maps.google.com/?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`);
    } catch {
      setError('No pudimos obtener tu ubicación. Pega un enlace o escribe la dirección.');
    } finally {
      setLocating(false);
    }
  };

  if (status === 'success') {
    return (
      <View style={[styles.screen, styles.success]}>
        <View style={styles.successIcon}><Check size={34} color={colors.ink} strokeWidth={3} /></View>
        <Kicker>/ RECIBIDO</Kicker>
        <Text style={styles.successTitle}>YA ESTÁ EN{'\n'}NUESTRO RADAR.</Text>
        <Text style={styles.successBody}>Gracias por compartir {values.spot.trim()}. Lo revisaremos con calma antes de sumarlo a Bruuk.</Text>
        <Button
          label="SUBIR OTRO SPOT"
          icon={ArrowRight}
          variant="accent"
          onPress={() => {
            setValues((current) => ({ spot: '', city: '', location: '', reason: '', email: current.email }));
            setStepIndex(0);
            setStatus('idle');
          }}
          style={{ alignSelf: 'stretch' }}
        />
        <Button label="LISTO" variant="ghost" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const loading = status === 'loading';
  const multiline = step === 'reason';
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {stepIndex === 0 && (
          <>
            <Kicker>/ NO IMPORTA LA CIUDAD</Kicker>
            <Text style={styles.hero}>¿TE GUSTA UN SPOT? <Text style={{ color: colors.violet }}>SÚBELO.</Text></Text>
            <Text style={styles.lead}>Toma menos de un minuto. Lo revisamos antes de publicarlo: aquí no entran rankings pagados.</Text>
          </>
        )}
        <ShadowBox offset={6}>
          <View style={styles.card}>
            <Text style={styles.stepCount}>PASO {stepIndex + 1} DE {STEPS.length}</Text>
            <View style={styles.bar}><View style={[styles.barFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} /></View>
            <Text style={styles.question}>{COPY[step].question}</Text>
            <Text style={styles.helper}>{COPY[step].helper}</Text>
            <TextInput
              key={step}
              ref={inputRef}
              style={[styles.input, multiline && styles.textarea]}
              value={values[step]}
              onChangeText={(value) => set(step, value)}
              placeholder={{ spot: 'Nombre del lugar', city: 'Escribe la ciudad', location: 'Enlace o dirección', reason: 'Ej. El pan francés es increíble y la terraza es perfecta por la mañana.', email: 'tu@correo.com' }[step]}
              placeholderTextColor="#8a8794"
              multiline={multiline}
              maxLength={{ spot: 120, city: 100, location: 500, reason: 1200, email: 180 }[step]}
              autoCapitalize={step === 'email' || step === 'location' ? 'none' : step === 'reason' ? 'sentences' : 'words'}
              autoCorrect={step === 'reason'}
              keyboardType={step === 'email' ? 'email-address' : step === 'location' ? 'url' : 'default'}
              autoComplete={step === 'email' ? 'email' : 'off'}
              returnKeyType={multiline ? 'default' : isLast ? 'send' : 'next'}
              onSubmitEditing={multiline ? undefined : next}
              editable={!loading}
              accessibilityLabel={COPY[step].question}
            />
            {step === 'city' && (
              <View style={styles.chips}>
                {CITY_SHORTCUTS.map((city) => <Chip key={city} dark label={city.toUpperCase()} active={values.city === city} onPress={() => set('city', city)} />)}
              </View>
            )}
            {step === 'location' && (
              <Pressable accessibilityRole="button" onPress={() => void locate()} disabled={locating} style={styles.tool}>
                <LocateFixed size={18} color={colors.ink} />
                <Text style={styles.toolText}>{locating ? 'UBICANDO…' : 'ESTOY AHÍ AHORA'}</Text>
              </Pressable>
            )}
            {step === 'reason' && (
              <Text style={styles.count}>{values.reason.trim().length < 10 ? `Mínimo 10 caracteres · ${values.reason.trim().length}/10` : `${values.reason.length}/1200`}</Text>
            )}
            {step === 'email' && <Text style={styles.summary}><Text style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{values.spot.trim()}</Text> · {values.city.trim()}</Text>}
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <View style={styles.actions}>
              {stepIndex > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Paso anterior"
                  onPress={() => {
                    tap();
                    setError('');
                    setStepIndex(stepIndex - 1);
                  }}
                  style={styles.back}
                >
                  <ChevronLeft size={22} color={colors.ink} />
                </Pressable>
              )}
              <Button
                label={isLast ? 'SUBIR A BRUUK' : step === 'location' && !values.location.trim() ? 'OMITIR' : 'SIGUIENTE'}
                icon={isLast ? Send : ArrowRight}
                onPress={next}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>
            {isLast && <Text style={styles.privacy}>Al enviarlo aceptas que Bruuk revise la recomendación. Tu correo nunca se publica.</Text>}
          </View>
        </ShadowBox>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 48, gap: 14 },
  hero: { color: colors.paper, fontFamily: fonts.display, fontSize: 36, lineHeight: 36, letterSpacing: -1.5 },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  card: { padding: 18, gap: 12, backgroundColor: colors.paper },
  stepCount: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  bar: { height: 4, backgroundColor: colors.lineDark },
  barFill: { height: 4, backgroundColor: colors.ink },
  question: { color: colors.ink, fontFamily: fonts.display, fontSize: 28, lineHeight: 29, letterSpacing: -1 },
  helper: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  input: { minHeight: 54, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.ink, fontFamily: fonts.body, fontSize: 16 },
  textarea: { minHeight: 140, paddingTop: 14, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tool: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.lilac, borderWidth: 1.5, borderColor: colors.ink },
  toolText: { color: colors.ink, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1 },
  count: { alignSelf: 'flex-end', color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12 },
  summary: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  back: { width: 54, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  privacy: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
  success: { padding: 24, gap: 14, justifyContent: 'center' },
  successIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft, borderWidth: 1.5, borderColor: colors.paper },
  successTitle: { color: colors.paper, fontFamily: fonts.display, fontSize: 44, lineHeight: 42, letterSpacing: -2 },
  successBody: { color: colors.muted, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
});
