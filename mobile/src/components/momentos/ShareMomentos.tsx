import { forwardRef, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, X } from 'lucide-react-native';
import { fotoUri, type Momento } from '../../lib/momentos/db';
import { diaDelMes, mesCorto } from '../../lib/momentos/fecha';
import { azar, formaDe, tonoDe } from '../../lib/momentos/orbita';
import { shareViewAsImage } from '../../lib/shareImage';
import { colors, fonts, space } from '../../theme';
import { Button, Chip, ErrorNote } from '../ui';

type Modo = 'tus3' | 'burbujas';

// Imágenes para historias, como ShareSheet de la web: "Tus 3" del año o todas las burbujas.
export function ShareMomentos({ visible, momentos, onClose }: { visible: boolean; momentos: Momento[]; onClose: () => void }) {
  const anios = useMemo(() => [...new Set(momentos.map((m) => m.fecha.slice(0, 4)))].sort().reverse(), [momentos]);
  const [modo, setModo] = useState<Modo>('tus3');
  const [anio, setAnio] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<ViewInstance>(null);

  const anioActivo = anio ?? anios[0] ?? String(new Date().getFullYear());
  const elegidos = momentos.filter((m) => m.destacado && m.fecha.startsWith(anioActivo)).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 3);
  const burbujas = modo === 'burbujas' && anio ? momentos.filter((m) => m.fecha.startsWith(anio)) : momentos;
  const listo = modo === 'tus3' ? elegidos.length > 0 : burbujas.length > 0;

  const compartir = async () => {
    setCompartiendo(true);
    setError('');
    try {
      await shareViewAsImage(ref, modo === 'tus3' ? `Mis 3 de ${anioActivo}` : 'Mis momentos');
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'No pudimos crear la imagen.');
    } finally {
      setCompartiendo(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <View style={styles.modes}>
            <Chip label="TUS 3" active={modo === 'tus3'} onPress={() => setModo('tus3')} />
            <Chip label="BURBUJAS" active={modo === 'burbujas'} onPress={() => setModo('burbujas')} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10} style={styles.close}>
            <X size={20} color={colors.paper} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.years}>
            {modo === 'burbujas' && <Chip label="TODO" active={!anio} onPress={() => setAnio(null)} />}
            {anios.map((value) => <Chip key={value} label={value} active={anioActivo === value && (modo === 'tus3' || anio === value)} onPress={() => setAnio(value)} />)}
          </View>
          {modo === 'tus3' && elegidos.length === 0 ? (
            <Text style={styles.empty}>Todavía no eliges tus 3 de {anioActivo}. Abre un momento y toca "Tus 3".</Text>
          ) : null}
          {listo && (
            <View style={styles.preview}>
              {modo === 'tus3' ? <Tus3Card ref={ref} anio={anioActivo} momentos={elegidos} /> : <BurbujasCard ref={ref} anio={anio} momentos={burbujas} />}
            </View>
          )}
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <Button label={compartiendo ? 'CREANDO IMAGEN…' : 'COMPARTIR'} icon={Share2} variant="accent" onPress={() => void compartir()} loading={compartiendo} disabled={!listo} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Circle({ momento, size }: { momento: Momento; size: number }) {
  const tono = tonoDe(momento.id);
  const uri = fotoUri(momento.foto);
  return (
    <View style={[{ width: size, height: size, backgroundColor: tono.fondo, overflow: 'hidden', borderWidth: 2, borderColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, formaDe(momento.id, size)]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <>
          <Text style={{ color: tono.texto, fontFamily: fonts.display, fontSize: size * 0.36, letterSpacing: -1 }}>{diaDelMes(momento.fecha)}</Text>
          <Text style={{ marginTop: -4, color: tono.texto, fontFamily: fonts.heading, fontSize: Math.max(8, size * 0.1), letterSpacing: 1 }}>{mesCorto(momento.fecha.slice(0, 7)).toUpperCase()}</Text>
        </>
      )}
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.site}>bruuk.space</Text>
      <Text style={styles.slogan}>MENOS PANTALLA · MÁS MUNDO</Text>
    </View>
  );
}

const Tus3Card = forwardRef<ViewInstance, { anio: string; momentos: Momento[] }>(function Tus3Card({ anio, momentos }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Text style={styles.cardKicker}>MIS 3 · BRUUK</Text>
      <Text style={styles.big}>MI {anio}{'\n'}<Text style={{ color: colors.violet }}>AFUERA.</Text></Text>
      <View style={{ gap: 14, marginTop: 18 }}>
        {momentos.map((momento, index) => (
          <View key={momento.id} style={[styles.tus3Row, index % 2 === 1 && { flexDirection: 'row-reverse' }]}>
            <Circle momento={momento} size={112} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.tus3Meta}>0{index + 1} · {diaDelMes(momento.fecha)} {mesCorto(momento.fecha.slice(0, 7)).toUpperCase()}</Text>
              <Text style={styles.tus3Title} numberOfLines={3}>{momento.titulo}</Text>
            </View>
          </View>
        ))}
      </View>
      <Footer />
    </View>
  );
});

const BurbujasCard = forwardRef<ViewInstance, { anio: string | null; momentos: Momento[] }>(function BurbujasCard({ anio, momentos }, ref) {
  const muestra = momentos.slice(0, 18);
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Text style={styles.count}>{momentos.length}</Text>
      <Text style={styles.countLabel}>{momentos.length === 1 ? 'MOMENTO' : 'MOMENTOS'} AFUERA{anio ? ` EN ${anio}` : ''}.</Text>
      <View style={styles.bubbles}>
        {muestra.map((momento) => {
          const size = 58 + azar(momento.id, 20) * 30 + (momento.destacado ? 10 : 0);
          return (
            <View key={momento.id} style={{ marginTop: (azar(momento.id, 21) - 0.5) * 18 }}>
              <Circle momento={momento} size={size} />
            </View>
          );
        })}
      </View>
      <Footer />
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: 10 },
  modes: { flexDirection: 'row', gap: 8 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line },
  content: { padding: space.gutter, paddingBottom: 40, gap: 14 },
  years: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { color: colors.muted, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  preview: { alignItems: 'center' },
  card: { width: 360, height: 640, padding: 24, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardKicker: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2 },
  big: { marginTop: 10, color: colors.paper, fontFamily: fonts.display, fontSize: 56, lineHeight: 52, letterSpacing: -2.5 },
  tus3Row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tus3Meta: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.4 },
  tus3Title: { color: colors.paper, fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 21 },
  count: { color: colors.paper, fontFamily: fonts.display, fontSize: 120, lineHeight: 112, letterSpacing: -6 },
  countLabel: { color: colors.violet, fontFamily: fonts.display, fontSize: 26, lineHeight: 26, letterSpacing: -1 },
  bubbles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderColor: colors.line },
  site: { color: colors.paper, fontFamily: fonts.display, fontSize: 15 },
  slogan: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.4 },
});
