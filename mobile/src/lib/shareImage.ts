import type { RefObject } from 'react';
import type { ViewInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// Toma una "foto" de una vista (dibujada fuera de pantalla a 360×640) y la abre en el menú de compartir
// a 1080×1920, el tamaño de una historia de Instagram. Igual que sharePlanImage.ts en la web.
export async function shareViewAsImage(ref: RefObject<ViewInstance | null>, dialogTitle: string) {
  const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1920, result: 'tmpfile' });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este teléfono no permite compartir imágenes.');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle, UTI: 'public.png' });
}
