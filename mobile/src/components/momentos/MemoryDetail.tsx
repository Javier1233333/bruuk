import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pencil, Star, Trash2, X, type LucideIcon } from 'lucide-react-native';
import { MAX_DESTACADOS, alternarDestacado, borrarMomento, fotoUri, type Momento } from '../../lib/momentos/db';
import { diaDelMes, fechaLarga, mesCorto } from '../../lib/momentos/fecha';
import { formaDe, tonoDe } from '../../lib/momentos/orbita';
import { colors, fonts, space } from '../../theme';
import { tap } from '../ui';

type Props = {
  momento: Momento | null;
  onClose: () => void;
  onEdit: (momento: Momento) => void;
  onChanged: () => void;
};

export function MemoryDetail({ momento, onClose, onEdit, onChanged }: Props) {
  const { width } = useWindowDimensions();
  const [aviso, setAviso] = useState('');
  if (!momento) return null;

  const size = Math.min(width - 80, 300);
  const tono = tonoDe(momento.id);
  const uri = fotoUri(momento.foto);

  const destacar = async () => {
    tap();
    const resultado = await alternarDestacado(momento);
    if (resultado === 'lleno') setAviso(`Ya tienes ${MAX_DESTACADOS} de ${momento.fecha.slice(0, 4)}. Quita uno para elegir este.`);
    else {
      setAviso('');
      onChanged();
    }
  };

  const borrar = () =>
    Alert.alert('Borrar este momento', 'Se borra de este teléfono. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await borrarMomento(momento);
          onChanged();
          onClose();
        },
      },
    ]);

  const acciones: { label: string; icon: LucideIcon; onPress: () => void; active?: boolean }[] = [
    { label: 'EDITAR', icon: Pencil, onPress: () => onEdit(momento) },
    { label: momento.destacado ? 'EN TUS 3' : 'TUS 3', icon: Star, onPress: () => void destacar(), active: momento.destacado },
    { label: 'BORRAR', icon: Trash2, onPress: borrar },
  ];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.kicker}>/ {fechaLarga(momento.fecha).toUpperCase()}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10} style={styles.close}>
            <X size={20} color={colors.paper} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[{ width: size, height: size, backgroundColor: tono.fondo, overflow: 'hidden', borderWidth: 2, borderColor: colors.paper }, formaDe(momento.id, size)]}>
            {uri ? (
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={momento.titulo} />
            ) : (
              <View style={styles.fecha}>
                <Text style={[styles.dia, { color: tono.texto }]}>{diaDelMes(momento.fecha)}</Text>
                <Text style={[styles.mes, { color: tono.texto }]}>{mesCorto(momento.fecha.slice(0, 7)).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {acciones.map(({ label, icon: Icon, onPress, active }) => (
              <Pressable key={label} accessibilityRole="button" onPress={onPress} style={[styles.action, active && styles.actionActive]}>
                <Icon size={18} color={active ? colors.ink : colors.paper} fill={active && Icon === Star ? colors.ink : 'none'} />
                <Text style={[styles.actionText, active && { color: colors.ink }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

          {/* La "cédula", como en un museo */}
          <View style={styles.cedula}>
            <Text style={styles.titulo}>{momento.titulo}</Text>
            {momento.descripcion ? <Text style={styles.descripcion}>{momento.descripcion}</Text> : null}
            {momento.etiquetas.length > 0 && <Text style={styles.etiquetas}>{momento.etiquetas.map((tag) => `#${tag}`).join('  ')}</Text>}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: 10, gap: 12 },
  kicker: { flex: 1, color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line },
  content: { alignItems: 'center', padding: space.gutter, paddingBottom: 40, gap: 18 },
  fecha: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dia: { fontFamily: fonts.display, fontSize: 96, letterSpacing: -4 },
  mes: { marginTop: -10, fontFamily: fonts.heading, fontSize: 18, letterSpacing: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { minWidth: 92, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.line },
  actionActive: { backgroundColor: colors.violetSoft, borderColor: colors.violetSoft },
  actionText: { color: colors.paper, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.2 },
  aviso: { color: colors.violetSoft, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  cedula: { alignSelf: 'stretch', gap: 8, padding: 16, backgroundColor: colors.paper },
  titulo: { color: colors.ink, fontFamily: fonts.display, fontSize: 26, lineHeight: 28, letterSpacing: -0.8 },
  descripcion: { color: colors.mutedDark, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  etiquetas: { color: colors.violetDeep, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.6 },
});
