import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Chip, Kicker, PlaceCard, Title } from './ui';
import { INTEREST_LABELS, placesFor, type PlanInterest } from '../lib/catalog';
import { colors, fonts, space } from '../theme';

type Props = { kicker: string; title: string; accent: string; intro: string; interests: PlanInterest[] };

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Lista filtrable compartida por Comer y Rack.
export function PlaceList({ kicker, title, accent, intro, interests }: Props) {
  const [filter, setFilter] = useState<PlanInterest | 'todos'>('todos');
  const [query, setQuery] = useState('');

  const places = useMemo(() => {
    const term = normalize(query.trim());
    return placesFor(filter === 'todos' ? interests : [filter]).filter(
      (place) => !term || normalize(`${place.name} ${place.type} ${place.description}`).includes(term),
    );
  }, [filter, interests, query]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={places}
        keyExtractor={(place) => place.id}
        renderItem={({ item }) => <PlaceCard place={item} />}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.header}>
            <Kicker>{kicker}</Kicker>
            <Title accent={accent}>{title}</Title>
            <Body>{intro}</Body>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o tipo"
              placeholderTextColor={colors.muted}
              style={styles.search}
              autoCorrect={false}
              returnKeyType="search"
            />
            {interests.length > 1 && (
              <View style={styles.chips}>
                <Chip label="TODOS" active={filter === 'todos'} onPress={() => setFilter('todos')} />
                {interests.map((interest) => (
                  <Chip key={interest} label={INTEREST_LABELS[interest].toUpperCase()} active={filter === interest} onPress={() => setFilter(interest)} />
                ))}
              </View>
            )}
            <Text style={styles.count}>{places.length} LUGARES</Text>
          </View>
        }
        ListEmptyComponent={<Body>No encontramos lugares con esa búsqueda.</Body>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 40, gap: 14 },
  header: { gap: 12, marginBottom: 4 },
  search: { minHeight: 50, paddingHorizontal: 14, color: colors.paper, borderWidth: 1.5, borderColor: colors.line, fontFamily: fonts.body, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  count: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
});
