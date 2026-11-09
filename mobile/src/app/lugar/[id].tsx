import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowUpRight, Dices, MapPin, Share2, Star } from 'lucide-react-native';
import { PlaceThumb, sharePlace } from '../../components/SpotCard';
import { Body, Button, Kicker, openUrl } from '../../components/ui';
import { INTEREST_LABELS } from '../../lib/catalog';
import { useContent } from '../../lib/content';
import { accentFor, placeVisual } from '../../lib/visual';
import { colors, fonts, space } from '../../theme';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlace, refresh, config } = useContent();
  const place = getPlace(id);
  // Un lugar recién agregado en el admin puede no estar en lo guardado: se pide /api/app una vez.
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (place || retried) return;
    void refresh().finally(() => setRetried(true));
  }, [place, retried, refresh]);

  if (!place) {
    return (
      <View style={styles.missing}>
        {retried ? <Body>No encontramos este lugar. Puede que ya no esté en la guía.</Body> : <ActivityIndicator color={colors.violet} />}
      </View>
    );
  }

  const { label, Icon } = placeVisual(place);
  return (
    <ScrollView style={{ backgroundColor: colors.ink }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: INTEREST_LABELS[place.interest] }} />
      <View style={[styles.stripe, { backgroundColor: accentFor(place) }]} />
      <PlaceThumb place={place} />
      <View style={styles.body}>
        <View style={styles.meta}>
          <Icon size={16} color={colors.violetSoft} />
          <Kicker>{place.type.toUpperCase()}{place.price ? ` · ${place.price}` : ''}</Kicker>
        </View>
        <Text style={styles.name} accessibilityRole="header">{place.name}</Text>
        <View style={styles.facts}>
          {place.zoneName ? (
            <View style={styles.fact}><MapPin size={14} color={colors.muted} /><Text style={styles.factText}>{place.zoneName}</Text></View>
          ) : null}
          {place.rating ? (
            <View style={styles.fact}><Star size={14} color={colors.muted} /><Text style={styles.factText}>{place.rating.toFixed(1)}</Text></View>
          ) : null}
          <Text style={styles.factText}>{label}</Text>
        </View>
        <Body>{place.description}</Body>
        {place.tip && place.tip !== place.description ? (
          <View style={styles.tip}>
            <Text style={styles.tipLabel}>VE POR</Text>
            <Text style={styles.tipText}>{place.tip}</Text>
          </View>
        ) : null}
        <Button label="CÓMO LLEGAR" icon={ArrowUpRight} variant="accent" onPress={() => openUrl(place.mapsUrl)} style={styles.button} />
        <Button label="COMPARTIR" icon={Share2} variant="ghost" onPress={() => sharePlace(place)} />
        {config.features.ruleta && (
          <Button label="ARMAR UN PLAN" icon={Dices} variant="ghost" onPress={() => router.push({ pathname: '/plan', params: { con: place.id } })} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.ink },
  content: { paddingBottom: 40 },
  stripe: { height: 6 },
  body: { padding: space.gutter, gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.paper, fontFamily: fonts.display, fontSize: 36, lineHeight: 37, letterSpacing: -1.2 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  factText: { color: colors.muted, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  tip: { padding: 14, gap: 4, backgroundColor: colors.lilac },
  tipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.6 },
  tipText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21 },
  button: { marginTop: 8 },
});
