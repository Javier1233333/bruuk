import { forwardRef } from 'react';
import { StyleSheet, Text, View, type ViewInstance } from 'react-native';
import type { CustomPlan, PlanPlace } from '../../lib/catalog';
import { accentFor, placeVisual } from '../../lib/visual';
import { colors, fonts } from '../../theme';
import { PlaceThumb } from '../SpotCard';

// La imagen para compartir el plan (historia 9:16). Se dibuja fuera de la pantalla a 360×640
// y shareViewAsImage la exporta a 1080×1920. Mismo diseño que src/lib/sharePlanImage.ts.
type Props = { plan: CustomPlan; getPlace: (id: string) => PlanPlace | undefined };

export const SharePlanCard = forwardRef<ViewInstance, Props>(function SharePlanCard({ plan, getPlace }, ref) {
  const stops = plan.stops.map((stop) => ({ stop, place: getPlace(stop.placeId) })).filter((item) => item.place).slice(0, 4);
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Text style={styles.logo}>bruuk<Text style={{ color: colors.violet }}>.</Text></Text>
      <Text style={styles.kicker}>MI PLAN · GDL</Text>
      <Text style={styles.title} numberOfLines={3}>{plan.title.toUpperCase()}</Text>
      {plan.thread ? <Text style={styles.thread} numberOfLines={3}><Text style={styles.threadLabel}>EL HILO  </Text>{plan.thread}</Text> : null}
      <View style={styles.stops}>
        {stops.map(({ stop, place }, index) => {
          const { label } = placeVisual(place!);
          return (
            <View key={stop.placeId} style={styles.stop}>
              <PlaceThumb place={place!} size={58} style={styles.thumb} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.stopMeta}>
                  <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
                  {stop.time ? <Text style={styles.time}>{stop.time}</Text> : null}
                  <Text style={[styles.stamp, { backgroundColor: accentFor(place!) }]}>{label}</Text>
                </View>
                <Text style={styles.name} numberOfLines={2}>{place!.name}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.site}>bruuk.space</Text>
        <Text style={styles.slogan}>MENOS PANTALLA · MÁS MUNDO</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { width: 360, height: 640, padding: 24, backgroundColor: colors.ink },
  logo: { color: colors.paper, fontFamily: fonts.display, fontSize: 30, letterSpacing: -1.5 },
  kicker: { marginTop: 22, color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2 },
  title: { marginTop: 8, color: colors.paper, fontFamily: fonts.display, fontSize: 36, lineHeight: 34, letterSpacing: -1.5 },
  thread: { marginTop: 10, color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  threadLabel: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  stops: { marginTop: 18, gap: 10 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: colors.paper },
  thumb: { borderWidth: 1.5, borderColor: colors.ink },
  stopMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  number: { color: colors.ink, fontFamily: fonts.display, fontSize: 16 },
  time: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 11 },
  stamp: { paddingHorizontal: 5, paddingVertical: 1, color: colors.ink, fontFamily: fonts.heading, fontSize: 8, letterSpacing: 1, overflow: 'hidden' },
  name: { color: colors.ink, fontFamily: fonts.display, fontSize: 16, lineHeight: 17 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderColor: colors.line },
  site: { color: colors.paper, fontFamily: fonts.display, fontSize: 15 },
  slogan: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.4 },
});
