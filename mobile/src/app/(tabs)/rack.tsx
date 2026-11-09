import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, type FlatList as FlatListType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useScrollToTop } from 'expo-router';
import { Grid3x3, Landmark, List, ShoppingBag, Store, Disc3, Sunset, Search, ArrowRight } from 'lucide-react-native';
import { PlaceThumb, SpotCard } from '../../components/SpotCard';
import { TopBar } from '../../components/TopBar';
import { ZoneChips, ZoneGuide, orderByZone } from '../../components/ZoneGuide';
import { Chip, Kicker, tap } from '../../components/ui';
import type { PlanPlace } from '../../lib/catalog';
import { useContent } from '../../lib/content';
import { accentFor, placeVisual, zoneLabel } from '../../lib/visual';
import { colors, fonts, space } from '../../theme';

type Filter = 'todos' | 'tiendas' | 'antiguedades' | 'tianguis' | 'cultura';

const FILTERS: { value: Filter; label: string; icon?: typeof Store; matches: (place: PlanPlace) => boolean }[] = [
  { value: 'todos', label: 'TODOS', matches: () => true },
  { value: 'tiendas', label: 'TIENDAS', icon: Store, matches: (place) => place.category === 'Rack recomienda' },
  { value: 'antiguedades', label: 'ANTIGÜEDADES', icon: Disc3, matches: (place) => place.category === 'Vinilos y antigüedades' },
  { value: 'tianguis', label: 'TIANGUIS', icon: ShoppingBag, matches: (place) => place.category === 'Tianguis' },
  { value: 'cultura', label: 'CULTURA', icon: Landmark, matches: (place) => place.interest === 'cultura' },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function RackScreen() {
  const { places, refresh, refreshing, zones } = useContent();
  const [zoneId, setZoneId] = useState<string | null>(null);
  const zone = zones.find((item) => item.value === zoneId) ?? null;
  const [filter, setFilter] = useState<Filter>('todos');
  const [grid, setGrid] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<FlatListType<PlanPlace>>(null);
  useScrollToTop(listRef);

  const rackPlaces = useMemo(() => places.filter((place) => place.interest === 'vintage' || place.interest === 'cultura'), [places]);
  const visible = useMemo(() => {
    const term = normalize(query.trim());
    const { matches } = FILTERS.find((item) => item.value === filter)!;
    const matching = rackPlaces.filter((place) => matches(place) && (!term || normalize(`${place.name} ${place.type} ${place.description} ${place.zoneName ?? ''}`).includes(term)));
    return orderByZone(matching, zone);
  }, [rackPlaces, filter, query, zone]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        ref={listRef}
        key={grid ? 'grid' : 'feed'}
        data={visible}
        numColumns={grid ? 2 : 1}
        keyExtractor={(place) => place.id}
        columnWrapperStyle={grid ? styles.gridRow : undefined}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.violet} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <TopBar />
            <Kicker>/ RACK · GDL</Kicker>
            <Text style={styles.title} accessibilityRole="header">
              VINTAGE Y{'\n'}<Text style={{ color: colors.violet }}>TIANGUIS.</Text>
            </Text>
            <Text style={styles.lead}>Ropa, vinilos, antigüedades, tianguis y espacios con historia propia.</Text>
            <View style={styles.searchRow}>
              <View style={styles.search}>
                <Search size={17} color={colors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar tienda, colonia, tianguis…"
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Buscar en Rack"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={grid ? 'Ver como lista' : 'Ver como cuadrícula'}
                onPress={() => {
                  tap();
                  setGrid((value) => !value);
                }}
                style={styles.viewToggle}
              >
                {grid ? <List size={20} color={colors.paper} /> : <Grid3x3 size={20} color={colors.paper} />}
              </Pressable>
            </View>
            <View style={styles.chips}>
              {FILTERS.map((item) => (
                <Chip key={item.value} label={item.label} icon={item.icon} active={filter === item.value} onPress={() => setFilter(item.value)} />
              ))}
            </View>
            <ZoneChips zones={zones} value={zoneId} onChange={setZoneId} />
            {zone && <ZoneGuide zone={zone} picks={visible.filter((place) => zone.picks?.includes(place.id))} total={visible.length} />}
            <Pressable accessibilityRole="link" onPress={() => router.push('/atardeceres')} style={styles.sunsetLink}>
              <Sunset size={18} color={colors.sunset} />
              <Text style={styles.sunsetText}>¿Y DESPUÉS? VER ATARDECERES</Text>
              <ArrowRight size={16} color={colors.paper} />
            </Pressable>
            <Text style={styles.count}>{visible.length} LUGARES</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.lead}>No encontramos lugares con esa búsqueda.</Text>}
        renderItem={({ item }) => (grid ? <GridCard place={item} /> : <SpotCard place={item} />)}
      />
    </SafeAreaView>
  );
}

// Tarjeta chica tipo "boleto" para la cuadrícula.
function GridCard({ place }: { place: PlanPlace }) {
  const { label } = placeVisual(place);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={place.name}
      onPress={() => router.push(`/lugar/${encodeURIComponent(place.id)}`)}
      style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.gridStripe, { backgroundColor: accentFor(place) }]} />
      <PlaceThumb place={place} style={{ aspectRatio: 1 }} />
      <View style={styles.gridBody}>
        <Text style={styles.gridLabel}>{label}{place.zoneName ? ` · ${zoneLabel(place).toUpperCase()}` : ''}</Text>
        <Text style={styles.gridName} numberOfLines={2}>{place.name}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 32, gap: 18 },
  header: { gap: 12 },
  title: { marginTop: 4, color: colors.paper, fontFamily: fonts.display, fontSize: 44, lineHeight: 42, letterSpacing: -2 },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  searchRow: { flexDirection: 'row', gap: 8 },
  search: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.line },
  searchInput: { flex: 1, color: colors.paper, fontFamily: fonts.body, fontSize: 16 },
  viewToggle: { width: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sunsetLink: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  sunsetText: { flex: 1, color: colors.paper, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1.2 },
  count: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  gridRow: { gap: 12 },
  gridCard: { flex: 1, maxWidth: '48.5%', backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink },
  gridStripe: { height: 5 },
  gridBody: { padding: 10, gap: 4 },
  gridLabel: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.2 },
  gridName: { color: colors.ink, fontFamily: fonts.display, fontSize: 15, lineHeight: 17 },
});
