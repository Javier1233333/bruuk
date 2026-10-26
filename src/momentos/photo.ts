import { useEffect, useRef } from 'react';

const MAX_LADO = 1600;

// Reduce la foto antes de guardarla: una foto del cel pesa 3–8 MB y así queda en ~300 KB.
export async function comprimirFoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    // Formatos que el navegador no sabe dibujar (p. ej. HEIC en Chrome): se guarda tal cual.
    return file;
  }
}

// <img> para un Blob: crea una URL temporal y la libera al desmontar o al cambiar de foto.
export function usePhotoRef(foto: Blob) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    const url = URL.createObjectURL(foto);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [foto]);
  return ref;
}

export const blobADataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const dataUrlABlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();
