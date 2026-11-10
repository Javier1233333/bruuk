import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, type FlatList as FlatListType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useScrollToTop } from 'expo-router';
import { ArrowRight, ArrowUpRight, Coffee, Landmark, Martini, Megaphone, Sunset, Utensils } from 'lucide-react-native';
import { HotspotsCard } from '../../components/HotspotsCard';
import { ZoneChips, ZoneGuide, orderByZone } from '../../components/ZoneGuide';
import { SpotCard } from '../../components/SpotCard';
import { TopBar } from '../../components/TopBar';
import { Button, Chip, Kicker, openUrl } from '../../components/ui';
import type { PlanPlace } from '../../lib/catalog';
import { useContent } from '../../lib/content';
import { colors, fonts, space } from '../../theme';

type Filter = 'todos' | 'cafe' | 'comida' | 'noche' | 'cultura' | 'atardecer';

const FILTERS: { value: Filter; label: string; icon?: typeof Coffee }[] = [
  { value: 'todos', label: 'TODOS' },
  { value: 'cafe', label: 'CAFÉS', icon: Coffee },
  { value: 'comida', label: 'COMIDA', icon: Utensils },
  { value: 'noche', label: 'BARES', icon: Martini },
  { value: 'cultura', label: 'MUSEOS', icon: Landmark },
  { value: 'atardecer', label: 'ATARDECERES', icon: Sunset },
];

type Row = { key: string; kind: 'guide'; places: PlanPlace[]; total: number } | { key: string; kind: 'hotspots'; places: PlanPlace[] } | { key: string; kind: 'place'; place: PlanPlace } | { key: string; kind: 'sunsetCover' };

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

export default function HomeScreen() {
  const { places, hotspots, sunsets, config, refresh, refreshing, byId, zones } = useContent();
  const [filter, setFilter] = useState<Filter>('todos');
  // Explorar por zona: abre con la guía de la zona y sólo sus lugares.
  const [zoneId, setZoneId] = useState<string | null>(null);
  const zone = zones.find((item) => item.value === zoneId) ?? null;
  const listRef = useRef<FlatListType<Row>>(null);
  useScrollToTop(listRef);

  // Como el feed de la web: los hotspots primero y el resto revuelto (una vez por carga).
  // Museos: sólo los que están en Spots (los del mapa original de cultura no tienen ficha completa).
  const isFeedPlace = (place: PlanPlace) => ['cafe', 'comida', 'noche'].includes(place.interest) || (place.interest === 'cultura' && /museo/i.test(place.type));
  const shuffled = useMemo(() => shuffle(places.filter(isFeedPlace)), [places]);

  const rows = useMemo<Row[]>(() => {
    if (filter === 'atardecer') {
      const ordered = sunsets.map((id) => byId.get(id)).filter((place): place is PlanPlace => Boolean(place));
      return [{ key: 'cover', kind: 'sunsetCover' }, ...ordered.map((place) => ({ key: place.id, kind: 'place' as const, place }))];
    }
    if (zone) {
      const inZone = orderByZone(shuffled.filter((place) => filter === 'todos' || place.interest === filter), zone);
      const picks = inZone.filter((place) => zone.picks?.includes(place.id));
      return [
        { key: `zone-${zone.value}`, kind: 'guide' as const, places: picks, total: inZone.length },
        ...inZone.map((place) => ({ key: place.id, kind: 'place' as const, place })),
      ];
    }
    const hot = hotspots.ids.map((id) => byId.get(id)).filter((place): place is PlanPlace => Boolean(place));
    const pinnedIds = hot.length > 0 ? hot.map((place) => place.id) : config.featuredSpotIds;
    const pinned = pinnedIds.map((id) => byId.get(id)).filter((place): place is PlanPlace => Boolean(place));
    const pinnedSet = new Set(pinned.map((place) => place.id));
    const rest = shuffled.filter((place) => !pinnedSet.has(place.id) && (filter === 'todos' || place.interest === filter));
    const head = filter === 'todos' ? pinned : pinned.filter((place) => place.interest === filter);
    return [
      ...(filter === 'todos' && hot.length > 0 ? [{ key: 'hotspots', kind: 'hotspots' as const, places: hot }] : []),
      ...[...head, ...rest].map((place) => ({ key: place.id, kind: 'place' as const, place })),
    ];
  }, [filter, sunsets, byId, hotspots.ids, config.featuredSpotIds, shuffled, zone]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.violet} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <TopBar />
            {config.banner && (
              <Pressable
                accessibilityRole={config.banner.url ? 'link' : 'text'}
                disabled={!config.banner.url}
                onPress={() => config.banner?.url && openUrl(config.banner.url)}
                style={styles.banner}
              >
                <Megaphone size={16} color={colors.ink} strokeWidth={2.4} />
                <Text style={styles.bannerText}>{config.banner.text}</Text>
                {config.banner.url ? <ArrowUpRight size={16} color={colors.ink} /> : null}
              </Pressable>
            )}
            <Kicker>{config.copy.homeKicker}</Kicker>
            <Text style={styles.title} accessibilityRole="header">
              {config.copy.homeTitle.toUpperCase()}
              {'\n'}
              <Text style={{ color: colors.violet }}>{config.copy.homeAccent.toUpperCase()}</Text>
            </Text>
            <Text style={styles.lead}>{config.copy.homeLead}</Text>
            <View style={styles.chips}>
              {FILTERS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  icon={item.icon}
                  active={filter === item.value}
                  onPress={() => {
                    setFilter(item.value);
                    listRef.current?.scrollToOffset({ offset: 0, animated: false });
                  }}
                />
              ))}
            </View>
            {filter !== 'atardecer' && (
              <ZoneChips
                zones={zones}
                value={zoneId}
                onChange={(value) => {
                  setZoneId(value);
                  listRef.current?.scrollToOffset({ offset: 0, animated: false });
                }}
              />
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === 'guide') return zone ? <ZoneGuide zone={zone} picks={item.places} total={item.total} /> : null;
          if (item.kind === 'hotspots') return <HotspotsCard places={item.places} date={hotspots.date} />;
          if (item.kind === 'sunsetCover') {
            return (
              <View style={styles.sunsetCover}>
                <Sunset size={30} color={colors.sunset} strokeWidth={2} />
                <Text style={styles.sunsetTitle}>DONDE CAE{'\n'}EL SOL.</Text>
                <Text style={styles.lead}>Miradores, parques y rooftops para ver el atardecer. Llega unos minutos antes.</Text>
              </View>
            );
          }
          return <SpotCard place={item.place} hotspotOf={hotspots.ids.length || undefined} />;
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Kicker>/ EL MAPA TAMBIÉN ES TUYO</Kicker>
            <Text style={styles.footerTitle}>¿TIENES UN SPOT{'\n'}QUE TE GUSTA?</Text>
            {config.features.subirSpot && <Button label="SUBIR UN SPOT" icon={ArrowRight} variant="accent" onPress={() => router.push('/sube-un-spot')} />}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 32, gap: 18 },
  header: { gap: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.violetSoft },
  bannerText: { flex: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 19 },
  title: { marginTop: 4, color: colors.paper, fontFamily: fonts.display, fontSize: 44, lineHeight: 42, letterSpacing: -2 },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  sunsetCover: { gap: 10, paddingVertical: 8 },
  sunsetTitle: { color: colors.paper, fontFamily: fonts.display, fontSize: 48, lineHeight: 46, letterSpacing: -2 },
  footer: { gap: 12, paddingTop: 22, borderTopWidth: 1, borderColor: colors.line },
  footerTitle: { color: colors.paper, fontFamily: fonts.display, fontSize: 30, lineHeight: 30, letterSpacing: -1 },
});
