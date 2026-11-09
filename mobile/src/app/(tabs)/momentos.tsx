import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useScrollToTop } from 'expo-router';
import { Download, Plus, Search, Share2, Upload } from 'lucide-react-native';
import { MemoryDetail } from '../../components/momentos/MemoryDetail';
import { MemoryEditor } from '../../components/momentos/MemoryEditor';
import { MemoryRoad } from '../../components/momentos/MemoryRoad';
import { ShareMomentos } from '../../components/momentos/ShareMomentos';
import { TopBar } from '../../components/TopBar';
import { Button, Chip, Kicker, ShadowBox, tap } from '../../components/ui';
import { useContent } from '../../lib/content';
import { exportarRespaldo, importarRespaldo } from '../../lib/momentos/backup';
import { leerMomentos, type Momento } from '../../lib/momentos/db';
import { claveMes, mesCorto, normalizar } from '../../lib/momentos/fecha';
import { colors, fonts, space } from '../../theme';

export default function MomentosScreen() {
  const { config } = useContent();
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [cargado, setCargado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mes, setMes] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ momento: Momento | null } | null>(null);
  const [abierto, setAbierto] = useState<Momento | null>(null);
  const [compartir, setCompartir] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  useScrollToTop(scrollRef);

  const recargar = useCallback(async () => {
    const lista = (await leerMomentos()).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn - a.creadoEn);
    setMomentos(lista);
    setCargado(true);
    // Si el detalle está abierto, se refresca con lo guardado (p. ej. al marcarlo en tus 3).
    setAbierto((actual) => (actual ? lista.find((m) => m.id === actual.id) ?? null : null));
  }, []);

  useFocusEffect(useCallback(() => { void recargar(); }, [recargar]));

  const meses = useMemo(() => [...new Set(momentos.map((m) => claveMes(m.fecha)))], [momentos]);
  const etiquetasUsadas = useMemo(() => [...new Set(momentos.flatMap((m) => m.etiquetas))], [momentos]);
  const visibles = useMemo(() => {
    const termino = normalizar(busqueda);
    return momentos.filter((m) => (!mes || claveMes(m.fecha) === mes)
      && (!termino || normalizar(`${m.titulo} ${m.descripcion} ${m.etiquetas.join(' ')}`).includes(termino)));
  }, [momentos, mes, busqueda]);

  const respaldo = () =>
    Alert.alert('Respaldo de Momentos', 'Tus momentos viven sólo en este teléfono. Guarda una copia para pasarlos a otro o no perderlos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Importar copia',
        onPress: async () => {
          try {
            const total = await importarRespaldo();
            if (total !== null) {
              await recargar();
              Alert.alert('Listo', `Se agregaron ${total} momentos.`);
            }
          } catch (error) {
            Alert.alert('No se pudo importar', error instanceof Error ? error.message : 'Inténtalo otra vez.');
          }
        },
      },
      {
        text: 'Guardar copia',
        onPress: () => void exportarRespaldo().catch(() => Alert.alert('No se pudo guardar', 'Inténtalo otra vez.')),
      },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TopBar />
        <Kicker>/ MOMENTOS</Kicker>
        <Text style={styles.title} accessibilityRole="header">LO QUE{'\n'}<Text style={{ color: colors.violet }}>VIVISTE.</Text></Text>
        <Text style={styles.lead}>{config.copy.momentosLead}</Text>

        <View style={styles.actions}>
          <Button label="AGREGAR" icon={Plus} variant="accent" onPress={() => setEditando({ momento: null })} style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" accessibilityLabel="Compartir tus momentos" disabled={momentos.length === 0} onPress={() => { tap(); setCompartir(true); }} style={[styles.iconButton, momentos.length === 0 && { opacity: 0.4 }]}>
            <Share2 size={20} color={colors.paper} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Respaldo" onPress={() => { tap(); respaldo(); }} style={styles.iconButton}>
            {momentos.length ? <Download size={20} color={colors.paper} /> : <Upload size={20} color={colors.paper} />}
          </Pressable>
        </View>

        {momentos.length > 0 && (
          <>
            <View style={styles.search}>
              <Search size={17} color={colors.muted} />
              <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar en tus momentos" placeholderTextColor={colors.muted} style={styles.searchInput} accessibilityLabel="Buscar en tus momentos" />
            </View>
            {meses.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>
                <Chip label="TODO" active={!mes} onPress={() => setMes(null)} />
                {meses.map((clave) => <Chip key={clave} label={`${mesCorto(clave).toUpperCase()} ${clave.slice(2, 4)}`} active={mes === clave} onPress={() => setMes(clave)} />)}
              </ScrollView>
            )}
          </>
        )}

        {cargado && momentos.length === 0 ? (
          <ShadowBox offset={6}>
            <Pressable accessibilityRole="button" onPress={() => setEditando({ momento: null })} style={styles.empty}>
              <View style={styles.emptyCircle}><Plus size={30} color={colors.ink} strokeWidth={2} /></View>
              <Text style={styles.emptyTitle}>TU PRIMER MOMENTO</Text>
              <Text style={styles.emptyBody}>Una salida, un café, una tarde. Con foto o sin foto. Nadie más lo ve.</Text>
            </Pressable>
          </ShadowBox>
        ) : visibles.length === 0 && momentos.length > 0 ? (
          <Text style={styles.lead}>Nada coincide con esa búsqueda.</Text>
        ) : (
          <MemoryRoad momentos={visibles} onOpen={setAbierto} />
        )}
      </ScrollView>

      <MemoryEditor
        visible={editando !== null}
        momento={editando?.momento ?? null}
        etiquetasUsadas={etiquetasUsadas}
        onClose={() => setEditando(null)}
        onSaved={() => {
          setEditando(null);
          void recargar();
        }}
      />
      <MemoryDetail
        momento={editando ? null : abierto}
        onClose={() => setAbierto(null)}
        onEdit={(momento) => setEditando({ momento })}
        onChanged={() => void recargar()}
      />
      <ShareMomentos visible={compartir} momentos={momentos} onClose={() => setCompartir(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.gutter, paddingBottom: 40, gap: 12 },
  title: { marginTop: 4, color: colors.paper, fontFamily: fonts.display, fontSize: 44, lineHeight: 42, letterSpacing: -2 },
  lead: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconButton: { width: 54, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line },
  search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.line },
  searchInput: { flex: 1, color: colors.paper, fontFamily: fonts.body, fontSize: 16 },
  months: { gap: 8 },
  empty: { alignItems: 'flex-start', gap: 10, padding: 20, backgroundColor: colors.paper },
  emptyCircle: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: colors.violetSoft, borderWidth: 1.5, borderColor: colors.ink },
  emptyTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 26, letterSpacing: -1 },
  emptyBody: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
});
