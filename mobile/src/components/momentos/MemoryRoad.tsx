import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { Star } from 'lucide-react-native';
import { fotoUri, type Momento } from '../../lib/momentos/db';
import { claveMes, diaDelMes, mesCorto, nombreMes } from '../../lib/momentos/fecha';
import { desvioDe, flotacionDe, formaDe, tamanoDe, tonoDe } from '../../lib/momentos/orbita';
import { colors, fonts } from '../../theme';
import { tap } from '../ui';

const GAP = 54; // espacio vertical entre círculos (incluye la cédula de abajo)
const MONTH_ROW = 46;

type Node = { kind: 'mes'; clave: string; y: number } | { kind: 'momento'; momento: Momento; x: number; y: number; size: number };

// El camino: un círculo por momento, de lado a lado, con una línea punteada que los une.
export function MemoryRoad({ momentos, onOpen }: { momentos: Momento[]; onOpen: (momento: Momento) => void }) {
  const { width } = useWindowDimensions();
  const ancho = width - 32;

  const nodes: Node[] = [];
  let y = 0;
  let mesActual = '';
  momentos.forEach((momento, index) => {
    const mes = claveMes(momento.fecha);
    if (mes !== mesActual) {
      nodes.push({ kind: 'mes', clave: mes, y });
      y += MONTH_ROW;
      mesActual = mes;
    }
    const size = tamanoDe(momento, width);
    const lado = index % 2 === 0 ? 0.3 : 0.7;
    const x = Math.min(Math.max(ancho * lado + desvioDe(momento.id), size / 2 + 4), ancho - size / 2 - 4);
    nodes.push({ kind: 'momento', momento, x, y: y + size / 2, size });
    y += size + GAP;
  });
  const total = y + 10;

  const centers = nodes.filter((node): node is Extract<Node, { kind: 'momento' }> => node.kind === 'momento');
  const path = centers.reduce((d, node, index) => {
    if (index === 0) return `M ${node.x} ${node.y}`;
    const prev = centers[index - 1];
    const midY = (prev.y + node.y) / 2;
    return `${d} C ${prev.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y}`;
  }, '');

  return (
    <View style={{ height: total }}>
      <Svg width={ancho} height={total} style={StyleSheet.absoluteFill}>
        <Path d={path} stroke={colors.violetDeep} strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      </Svg>
      {nodes.map((node) =>
        node.kind === 'mes' ? (
          <Text key={`mes-${node.clave}`} style={[styles.mes, { top: node.y + 10 }]}>{nombreMes(node.clave).toUpperCase()}</Text>
        ) : (
          <Bubble key={node.momento.id} momento={node.momento} x={node.x} y={node.y} size={node.size} onOpen={onOpen} />
        ),
      )}
    </View>
  );
}

function Bubble({ momento, x, y, size, onOpen }: { momento: Momento; x: number; y: number; size: number; onOpen: (momento: Momento) => void }) {
  const float = useRef(new Animated.Value(0)).current;
  const tono = tonoDe(momento.id);
  const forma = formaDe(momento.id, size);
  const uri = fotoUri(momento.foto);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      const { duracion, retraso } = flotacionDe(momento.id);
      loop = Animated.loop(
        Animated.sequence([
          Animated.delay(retraso),
          Animated.timing(float, { toValue: 1, duration: duracion / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: duracion / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [float, momento.id]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  return (
    <Animated.View style={[styles.node, { left: x - size / 2, top: y - size / 2, width: size, transform: [{ translateY }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${momento.titulo}, ${diaDelMes(momento.fecha)} ${mesCorto(momento.fecha.slice(0, 7))}`}
        onPress={() => {
          tap();
          onOpen(momento);
        }}
        style={({ pressed }) => [{ width: size, height: size, backgroundColor: tono.fondo, overflow: 'hidden', borderWidth: 2, borderColor: colors.paper }, forma, pressed && { opacity: 0.8 }]}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.fecha}>
            <Text style={[styles.dia, { color: tono.texto, fontSize: size * 0.34 }]}>{diaDelMes(momento.fecha)}</Text>
            <Text style={[styles.mesCorto, { color: tono.texto }]}>{mesCorto(momento.fecha.slice(0, 7)).toUpperCase()}</Text>
          </View>
        )}
      </Pressable>
      {momento.destacado && (
        <View style={styles.star}>
          <Star size={13} color={colors.ink} fill={colors.ink} />
        </View>
      )}
      <Text style={styles.titulo} numberOfLines={2}>{momento.titulo}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mes: { position: 'absolute', left: 0, color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.8 },
  node: { position: 'absolute', alignItems: 'center' },
  fecha: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dia: { fontFamily: fonts.display, letterSpacing: -1 },
  mesCorto: { marginTop: -4, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.4 },
  star: { position: 'absolute', top: -2, right: -2, width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft, borderRadius: 13, borderWidth: 1.5, borderColor: colors.ink },
  titulo: { marginTop: 6, maxWidth: 150, color: colors.paper, fontFamily: fonts.heading, fontSize: 12, lineHeight: 15, textAlign: 'center' },
});
