import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { deleteUser } from 'firebase/auth';
import { AtSign, ChevronRight, Globe, LogOut, Mail, Shield, Store, Trash2, type LucideIcon } from 'lucide-react-native';
import { Body, ErrorNote, Kicker, Screen, openUrl, tap } from '../components/ui';
import { authErrorMessage, useAuth } from '../lib/auth';
import { SITE_URL } from '../lib/catalog';
import { useContent } from '../lib/content';
import { APP_VERSION } from '../lib/version';
import { colors, fonts } from '../theme';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { config, source } = useContent();
  const [error, setError] = useState('');

  const links: { label: string; hint: string; icon: LucideIcon; url: string }[] = [
    { label: 'Contacto', hint: config.links.contacto.replace('mailto:', ''), icon: Mail, url: config.links.contacto },
    { label: 'Instagram', hint: config.links.instagram.replace(/^https?:\/\/(www\.)?/, ''), icon: AtSign, url: config.links.instagram },
    { label: '¿Tienes un negocio?', hint: 'Pide una reseña honesta, cero pagada', icon: Store, url: `${SITE_URL}/negocios` },
    { label: 'bruuk.space', hint: 'La guía en la web', icon: Globe, url: config.links.web },
    { label: 'Aviso de privacidad', hint: 'Cómo cuidamos tus datos', icon: Shield, url: config.links.privacidad },
  ];

  const confirmDelete = () => {
    Alert.alert(
      'Borrar tu cuenta',
      'Se borra tu cuenta de Bruuk. Tus Momentos se quedan en este teléfono hasta que borres la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteUser(user);
            } catch (deleteError) {
              const code = (deleteError as { code?: string })?.code;
              // Firebase pide una sesión reciente para borrar: se cierra y se vuelve a entrar.
              setError(code === 'auth/requires-recent-login'
                ? 'Por seguridad, cierra sesión, vuelve a entrar y bórrala de nuevo.'
                : authErrorMessage(deleteError));
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Kicker>/ TU CUENTA</Kicker>
      <Text style={styles.email}>{user?.email ?? 'Sin correo'}</Text>
      {user && !user.emailVerified && <Body>Revisa tu correo para verificar tu cuenta.</Body>}

      <View style={styles.list}>
        {links.map((item) => (
          <Row key={item.label} {...item} onPress={() => openUrl(item.url)} />
        ))}
        <Row label="Cerrar sesión" hint="Vuelve cuando quieras" icon={LogOut} onPress={() => void signOut()} />
        <Row label="Borrar mi cuenta" hint="Para siempre" icon={Trash2} danger onPress={confirmDelete} />
      </View>
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <Text style={styles.version}>
        BRUUK {APP_VERSION}
        {Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : ''}
        {source === 'live' ? ' · AL DÍA' : source === 'cache' ? ' · SIN CONEXIÓN' : ''}
      </Text>
    </Screen>
  );
}

function Row({ label, hint, icon: Icon, onPress, danger = false }: { label: string; hint: string; icon: LucideIcon; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.inkSoft }]}
    >
      <Icon size={21} color={danger ? '#ff8a8a' : colors.violet} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, danger && { color: '#ff8a8a' }]}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  email: { color: colors.paper, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.6 },
  list: { marginTop: 8, borderTopWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: colors.line },
  label: { color: colors.paper, fontFamily: fonts.heading, fontSize: 16 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  version: { marginTop: 12, color: colors.tabInactive, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4, textAlign: 'center' },
});
