import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Body, Kicker, Logo, PlaceCard, Screen, Title } from '../../components/ui';
import { getPlace, PLAN_PLACES } from '../../lib/catalog';
import { colors, fonts } from '../../theme';

const FEATURED = ['spot_003', 'spot_018', 'spot_105', 'spot_131'];

const GATEWAYS: { href: Href; number: string; label: string; hint: string; icon: keyof typeof Feather.glyphMap }[] = [
  { href: '/comer', number: '01', label: 'COMER Y TOMAR', hint: 'Cafés, comida y noche', icon: 'coffee' },
  { href: '/rack', number: '02', label: 'VINTAGE Y TIANGUIS', hint: 'Ropa, objetos, mercados y cultura', icon: 'shopping-bag' },
  { href: '/plan', number: '03', label: 'ARMA TU PLAN', hint: 'Cinco preguntas, una ruta real', icon: 'zap' },
  { href: '/atardeceres', number: '04', label: 'ATARDECERES', hint: 'Miradores para ver caer el sol', icon: 'sunset' },
];

export default function HomeScreen() {
  const featured = FEATURED.map(getPlace).filter((place) => place !== undefined);

  return (
    <Screen>
      <Logo />
      <View style={styles.hero}>
        <Kicker>/ GUADALAJARA · EDICIÓN 001</Kicker>
        <Title accent="Más mundo.">Menos pantalla.</Title>
        <Body>Dónde comer y tomar, vintage y tianguis, y planes para salir. Elegidos por personas reales, sin rankings pagados.</Body>
        <Text style={styles.count}>{PLAN_PLACES.length} LUGARES EN LA GUÍA</Text>
      </View>

      <View style={styles.gateways}>
        {GATEWAYS.map((gateway) => (
          <Pressable key={gateway.label} accessibilityRole="link" onPress={() => router.push(gateway.href)} style={({ pressed }) => [styles.gateway, pressed && { backgroundColor: '#1a1826' }]}>
            <Text style={styles.gatewayNumber}>{gateway.number}</Text>
            <Feather name={gateway.icon} size={22} color={colors.violet} />
            <View style={{ flex: 1 }}>
              <Text style={styles.gatewayLabel}>{gateway.label}</Text>
              <Text style={styles.gatewayHint}>{gateway.hint}</Text>
            </View>
            <Feather name="arrow-up-right" size={20} color={colors.paper} />
          </Pressable>
        ))}
      </View>

      <Kicker>/ ASÍ SE VE BRUUK</Kicker>
      <Text style={styles.sectionTitle}>LUGARES REALES.{'\n'}RAZONES CONCRETAS.</Text>
      {featured.map((place) => <PlaceCard key={place.id} place={place} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, paddingVertical: 18 },
  count: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  gateways: { borderTopWidth: 1, borderColor: colors.line, marginBottom: 18 },
  gateway: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: colors.line },
  gatewayNumber: { color: colors.muted, fontFamily: fonts.heading, fontSize: 12, width: 22 },
  gatewayLabel: { color: colors.paper, fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.3 },
  gatewayHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: colors.paper, fontFamily: fonts.display, fontSize: 28, lineHeight: 30, letterSpacing: -1 },
});
