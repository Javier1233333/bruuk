import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Body, Button, Chip, Kicker, Title } from '../components/ui';
import { postApi } from '../lib/api';
import { colors, fonts, space } from '../theme';

const CITY_SHORTCUTS = ['Guadalajara', 'Zapopan', 'Tlaquepaque'];
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitSpotScreen() {
  const [spotName, setSpotName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const validate = () => {
    if (spotName.trim().length < 2) return 'Escribe el nombre del spot.';
    if (city.trim().length < 2) return 'Escribe la ciudad del spot.';
    if (reason.trim().length < 10) return 'Cuéntanos un poco más: ¿por qué te gusta este lugar?';
    if (!EMAIL_PATTERN.test(email.trim())) return 'Escribe un correo válido para poder preguntarte si falta algún dato.';
    return '';
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setStatus('error');
      setError(problem);
      return;
    }
    setStatus('loading');
    try {
      await postApi('place-proposal', {
        spotName: spotName.trim(),
        city: city.trim(),
        location: location.trim(),
        reason: reason.trim(),
        email: email.trim().toLowerCase(),
        website: '',
      });
      setStatus('success');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el spot.');
    }
  };

  if (status === 'success') {
    return (
      <View style={[styles.screen, styles.success]}>
        <Feather name="check" size={36} color={colors.violet} />
        <Kicker>/ RECIBIDO</Kicker>
        <Title>Ya está en nuestro radar.</Title>
        <Body>Gracias por compartir {spotName.trim()}. Lo revisaremos con calma antes de sumarlo a Bruuk.</Body>
        <Button label="VOLVER" icon="arrow-left" variant="secondary" onPress={() => router.back()} style={{ borderColor: colors.paper, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const loading = status === 'loading';
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Kicker>/ NO IMPORTA LA CIUDAD</Kicker>
        <Title accent="Súbelo.">¿Te gusta un spot?</Title>
        <Body>Toma menos de un minuto. Lo revisamos antes de publicarlo: aquí no entran rankings pagados.</Body>

        <Field label="¿Cómo se llama el lugar?">
          <TextInput style={styles.input} value={spotName} onChangeText={setSpotName} placeholder="Nombre del lugar" placeholderTextColor={colors.muted} maxLength={120} editable={!loading} />
        </Field>
        <Field label="¿En qué ciudad está?">
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Escribe la ciudad" placeholderTextColor={colors.muted} maxLength={100} editable={!loading} />
          <View style={styles.chips}>
            {CITY_SHORTCUTS.map((option) => <Chip key={option} label={option.toUpperCase()} active={city === option} onPress={() => setCity(option)} />)}
          </View>
        </Field>
        <Field label="¿Dónde lo encontramos? (opcional)">
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Enlace de Maps, Instagram o dirección" placeholderTextColor={colors.muted} autoCapitalize="none" maxLength={500} editable={!loading} />
        </Field>
        <Field label="¿Por qué te gusta?">
          <TextInput style={[styles.input, styles.textarea]} value={reason} onChangeText={setReason} placeholder="Qué pedir, cuándo ir, qué lo hace especial…" placeholderTextColor={colors.muted} multiline maxLength={1200} editable={!loading} />
        </Field>
        <Field label="¿A dónde te escribimos?">
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="tu@correo.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={180} editable={!loading} />
        </Field>

        {status === 'error' && <Text style={styles.error}>{error}</Text>}
        <Button label={loading ? 'ENVIANDO…' : 'SUBIR A BRUUK'} icon="send" onPress={() => void submit()} disabled={loading} style={styles.submit} />
        <Text style={styles.privacy}>Al enviarlo aceptas que Bruuk revise la recomendación. Tu correo nunca se publica.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 48, gap: 16 },
  success: { padding: space.gutter, gap: 14, justifyContent: 'center' },
  label: { color: colors.paper, fontFamily: fonts.heading, fontSize: 16 },
  input: { minHeight: 52, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.paper, fontFamily: fonts.body, fontSize: 16 },
  textarea: { minHeight: 130, paddingTop: 14, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { padding: 12, color: colors.white, backgroundColor: colors.error, fontFamily: fonts.body },
  submit: { backgroundColor: colors.violet, borderColor: colors.violet },
  privacy: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
});
