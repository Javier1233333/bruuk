import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Body, Button, Kicker, openUrl } from '../../components/ui';
import { getPlace, imageUri, INTEREST_LABELS } from '../../lib/catalog';
import { colors, fonts, space } from '../../theme';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = getPlace(id);

  if (!place) {
    return (
      <View style={styles.missing}>
        <Body>No encontramos este lugar.</Body>
      </View>
    );
  }

  const uri = imageUri(place);
  return (
    <ScrollView style={{ backgroundColor: colors.ink }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: INTEREST_LABELS[place.interest] }} />
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.image, styles.imageEmpty]}><Feather name="map-pin" size={36} color={colors.violet} /></View>
      )}
      <View style={styles.body}>
        <Kicker>{place.type.toUpperCase()}{place.price ? ` · ${place.price}` : ''}</Kicker>
        <Text style={styles.name}>{place.name}</Text>
        <Body>{place.description}</Body>
        {place.tip && place.tip !== place.description && (
          <View style={styles.tip}>
            <Text style={styles.tipLabel}>VE POR</Text>
            <Text style={styles.tipText}>{place.tip}</Text>
          </View>
        )}
        <Button label="CÓMO LLEGAR" icon="arrow-up-right" onPress={() => openUrl(place.mapsUrl)} style={styles.button} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  content: { paddingBottom: 40 },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.lilac },
  imageEmpty: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: space.gutter, gap: 12 },
  name: { color: colors.paper, fontFamily: fonts.display, fontSize: 34, lineHeight: 36, letterSpacing: -1.2 },
  tip: { padding: 14, gap: 4, backgroundColor: colors.lilac },
  tipLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.6 },
  tipText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21 },
  button: { marginTop: 8, backgroundColor: colors.violet, borderColor: colors.violet },
});
