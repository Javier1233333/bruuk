import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePlus, Trash2, X } from 'lucide-react-native';
import { borrarFoto, fotoUri, guardarFoto, guardarMomentos, hoy, nuevoId, type Momento } from '../../lib/momentos/db';
import { fechaLarga, leerEtiquetas, normalizar } from '../../lib/momentos/fecha';
import { colors, fonts, space } from '../../theme';
import { Button, Chip, ErrorNote } from '../ui';

type Props = {
  visible: boolean;
  momento: Momento | null; // null = nuevo
  etiquetasUsadas: string[];
  onClose: () => void;
  onSaved: (momento: Momento) => void;
};

type Foto = { uri: string; width?: number; height?: number } | null;

export async function elegirFoto(): Promise<Foto> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted && permiso.accessPrivileges !== 'limited') throw new Error('Dale permiso a Bruuk para ver tus fotos desde Ajustes.');
  const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1, allowsEditing: false });
  if (resultado.canceled || !resultado.assets[0]) return null;
  const asset = resultado.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function MemoryEditor({ visible, momento, etiquetasUsadas, onClose, onSaved }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [etiquetaNueva, setEtiquetaNueva] = useState('');
  // undefined = sin cambios; null = quitar la foto; objeto = foto nueva elegida
  const [fotoNueva, setFotoNueva] = useState<Foto | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTitulo(momento?.titulo ?? '');
    setDescripcion(momento?.descripcion ?? '');
    setFecha(momento?.fecha ?? hoy());
    setEtiquetas(momento?.etiquetas ?? []);
    setEtiquetaNueva('');
    setFotoNueva(undefined);
    setError('');
  }, [visible, momento]);

  const fotoActual = fotoNueva === undefined ? fotoUri(momento?.foto ?? null) : fotoNueva?.uri;

  const cambiarFoto = async () => {
    try {
      const elegida = await elegirFoto();
      if (elegida) setFotoNueva(elegida);
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : 'No pudimos abrir tus fotos.');
    }
  };

  const agregarEtiquetas = (texto: string) => {
    const nuevas = leerEtiquetas(texto).filter((tag) => !etiquetas.some((actual) => normalizar(actual) === normalizar(tag)));
    if (nuevas.length) setEtiquetas((actuales) => [...actuales, ...nuevas].slice(0, 8));
    setEtiquetaNueva('');
  };

  const guardar = async () => {
    if (!titulo.trim()) {
      setError('Ponle un título a tu momento.');
      return;
    }
    if (!FECHA.test(fecha)) {
      setError('Escribe la fecha como AAAA-MM-DD.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const id = momento?.id ?? nuevoId();
      let foto = momento?.foto ?? null;
      if (fotoNueva !== undefined) {
        foto = fotoNueva ? await guardarFoto(fotoNueva.uri, id, fotoNueva.width, fotoNueva.height) : null;
        if (momento?.foto && momento.foto !== foto) borrarFoto(momento.foto);
      }
      const listo: Momento = {
        id,
        fecha,
        titulo: titulo.trim().slice(0, 80),
        descripcion: descripcion.trim().slice(0, 1200),
        etiquetas: etiquetaNueva.trim() ? [...etiquetas, ...leerEtiquetas(etiquetaNueva)].slice(0, 8) : etiquetas,
        foto,
        creadoEn: momento?.creadoEn ?? Date.now(),
        destacado: momento?.destacado ?? false,
      };
      await guardarMomentos([listo]);
      onSaved(listo);
    } catch {
      setError('No pudimos guardar el momento. Inténtalo otra vez.');
    } finally {
      setGuardando(false);
    }
  };

  const sugeridas = etiquetasUsadas.filter((tag) => !etiquetas.some((actual) => normalizar(actual) === normalizar(tag))).slice(0, 5);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.top}>
            <Text style={styles.kicker}>{momento ? '/ EDITAR MOMENTO' : '/ NUEVO MOMENTO'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10} style={styles.close}>
              <X size={20} color={colors.paper} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable accessibilityRole="button" accessibilityLabel={fotoActual ? 'Cambiar foto' : 'Agregar foto'} onPress={() => void cambiarFoto()} style={styles.photo}>
              {fotoActual ? (
                <Image source={{ uri: fotoActual }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={styles.photoEmpty}>
                  <ImagePlus size={34} color={colors.violetSoft} />
                  <Text style={styles.photoText}>AGREGAR FOTO</Text>
                  <Text style={styles.photoHint}>Opcional. Se guarda sólo en tu teléfono.</Text>
                </View>
              )}
            </Pressable>
            {fotoActual ? (
              <Pressable accessibilityRole="button" onPress={() => setFotoNueva(null)} style={styles.removePhoto}>
                <Trash2 size={14} color={colors.muted} />
                <Text style={styles.removeText}>QUITAR FOTO</Text>
              </Pressable>
            ) : null}

            <Text style={styles.label}>¿QUÉ PASÓ?</Text>
            <TextInput value={titulo} onChangeText={setTitulo} placeholder="Ej. Primer café en el Centro" placeholderTextColor={colors.muted} style={styles.input} maxLength={80} />

            <Text style={styles.label}>¿CUÁNDO?</Text>
            <View style={styles.row}>
              <Chip label="HOY" active={fecha === hoy()} onPress={() => setFecha(hoy())} />
              <Chip label="AYER" active={fecha === hoy(-1)} onPress={() => setFecha(hoy(-1))} />
              <TextInput
                value={fecha}
                onChangeText={setFecha}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.dateInput]}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                accessibilityLabel="Fecha del momento"
              />
            </View>
            {FECHA.test(fecha) ? <Text style={styles.hint}>{fechaLarga(fecha)}</Text> : null}

            <Text style={styles.label}>CUÉNTALO</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Con quién, qué pediste, qué se dijo…"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textarea]}
              multiline
              maxLength={1200}
            />

            <Text style={styles.label}>ETIQUETAS</Text>
            {etiquetas.length > 0 && (
              <View style={styles.row}>
                {etiquetas.map((tag) => <Chip key={tag} label={`#${tag}  ×`} active onPress={() => setEtiquetas((actuales) => actuales.filter((item) => item !== tag))} />)}
              </View>
            )}
            <TextInput
              value={etiquetaNueva}
              onChangeText={(texto) => (/[,\n]/.test(texto) ? agregarEtiquetas(texto) : setEtiquetaNueva(texto))}
              onSubmitEditing={() => agregarEtiquetas(etiquetaNueva)}
              placeholder="café, amigos, centro"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
              returnKeyType="done"
            />
            {sugeridas.length > 0 && (
              <View style={styles.row}>
                {sugeridas.map((tag) => <Chip key={tag} label={`#${tag}`} onPress={() => agregarEtiquetas(tag)} />)}
              </View>
            )}

            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <Button label={momento ? 'GUARDAR CAMBIOS' : 'GUARDAR MOMENTO'} variant="accent" onPress={() => void guardar()} loading={guardando} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: 10 },
  kicker: { color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.8 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.line },
  content: { padding: space.gutter, paddingBottom: 40, gap: 10 },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.inkSoft, borderWidth: 1.5, borderColor: colors.line, overflow: 'hidden' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoText: { color: colors.paper, fontFamily: fonts.display, fontSize: 16, letterSpacing: 1 },
  photoHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  removePhoto: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', minHeight: 32 },
  removeText: { color: colors.muted, fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.2 },
  label: { marginTop: 6, color: colors.violetSoft, fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.6 },
  input: { minHeight: 50, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.paper, fontFamily: fonts.body, fontSize: 16 },
  dateInput: { flex: 1, minWidth: 130 },
  textarea: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
});
