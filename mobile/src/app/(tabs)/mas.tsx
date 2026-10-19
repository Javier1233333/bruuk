import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Body, Kicker, Logo, openUrl, Screen } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { SITE_URL } from '../../lib/catalog';
import { colors, fonts } from '../../theme';

type Item = { label: string; hint: string; icon: keyof typeof Feather.glyphMap } & ({ href: Href } | { url: string });

const ITEMS: Item[] = [
  { label: 'Sube un spot', hint: 'Recomienda un lugar de cualquier ciudad', icon: 'plus-circle', href: '/sube-un-spot' },
  { label: 'Atardeceres', hint: 'Miradores en Guadalajara y Zapopan', icon: 'sunset', href: '/atardeceres' },
  { label: 'Señales de Radar', hint: 'Planes, eventos y aperturas en la ciudad', icon: 'radio', url: `${SITE_URL}/guadalajara/senales` },
  { label: 'Ruta de museos', hint: 'Diez museos y espacios culturales', icon: 'map', url: `${SITE_URL}/guadalajara/ruta-museos` },
  { label: 'Contacto', hint: 'contacto@bruuk.space', icon: 'mail', url: 'mailto:contacto@bruuk.space' },
  { label: 'Aviso de privacidad', hint: 'Cómo cuidamos tus datos', icon: 'shield', url: `${SITE_URL}/privacidad` },
];

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  return (
    <Screen>
      <Logo />
      <Kicker>/ MÁS DE BRUUK</Kicker>
      <View style={styles.list}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="link"
            onPress={() => ('href' in item ? router.push(item.href) : openUrl(item.url))}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: '#1a1826' }]}
          >
            <Feather name={item.icon} size={22} color={colors.violet} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.hint}>{item.hint}</Text>
            </View>
            <Feather name={'href' in item ? 'chevron-right' : 'external-link'} size={18} color={colors.muted} />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.item, pressed && { backgroundColor: '#1a1826' }]}
        >
          <Feather name="log-out" size={22} color={colors.violet} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Cerrar sesión</Text>
            {user?.email && <Text style={styles.hint}>{user.email}</Text>}
          </View>
        </Pressable>
      </View>
      <Body>Bruuk es una guía hecha por personas. Menos pantalla, más mundo.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 1, borderColor: colors.line },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: colors.line },
  label: { color: colors.paper, fontFamily: fonts.heading, fontSize: 17 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
});
