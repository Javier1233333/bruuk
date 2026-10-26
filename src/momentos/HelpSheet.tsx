import { useEffect, useRef, useState } from 'react';
import { Download, LoaderCircle, Upload, X } from 'lucide-react';
import { estaProtegido, pedirPersistencia } from './db';
import { exportarRespaldo, importarRespaldo } from './backup';
import { useSheet } from './useSheet';

// Todo lo que explica Momentos vive aquí (botón "?") para que la pantalla quede limpia.
// Momentos no sube nada a internet: si se pierde el teléfono, la copia es lo único que queda.
export function HelpSheet({ total, onClose }: { total: number; onClose: () => void }) {
  useSheet(onClose);
  const fileRef = useRef<HTMLInputElement>(null);
  const [protegido, setProtegido] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState<'exportar' | 'importar' | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    void estaProtegido().then(setProtegido);
  }, []);

  const exportar = async () => {
    setOcupado('exportar');
    setMensaje(null);
    try {
      const cuantos = await exportarRespaldo();
      if (cuantos !== null) setMensaje({ tipo: 'ok', texto: `Copia lista con ${cuantos} ${cuantos === 1 ? 'momento' : 'momentos'}.` });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo crear la copia. Intenta otra vez.' });
    }
    setOcupado(null);
  };

  const importar = async (file: File | undefined) => {
    if (!file) return;
    setOcupado('importar');
    setMensaje(null);
    try {
      const cuantos = await importarRespaldo(file);
      setMensaje({ tipo: 'ok', texto: `Se restauraron ${cuantos} ${cuantos === 1 ? 'momento' : 'momentos'}.` });
      setProtegido(await pedirPersistencia());
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'No se pudo leer la copia.' });
    }
    setOcupado(null);
  };

  return (
    <div className="momentos-backdrop" onClick={onClose}>
      <section className="momentos-help" role="dialog" aria-modal="true" aria-labelledby="momentos-help-title" onClick={(event) => event.stopPropagation()}>
        <header className="momentos-help-head">
          <h2 id="momentos-help-title">MOMENTOS</h2>
          <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        </header>

        <ul className="momentos-help-points">
          <li>Cada momento es un círculo en tu camino. Toca uno para abrirlo.</li>
          <li>Elige tus 3 del año y compártelos como imagen.</li>
          <li>Se queda sólo en este teléfono. Nadie más lo ve.</li>
          <li>{protegido
            ? 'El navegador no lo borrará aunque se llene el teléfono.'
            : 'Si cambias de teléfono o borras el navegador, se pierde. Haz una copia.'}</li>
        </ul>

        <div className="momentos-help-actions">
          <button type="button" className="momentos-primary" onClick={() => void exportar()} disabled={!!ocupado || total === 0}>
            {ocupado === 'exportar' ? <LoaderCircle className="momentos-spin" size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />} EXPORTAR COPIA
          </button>
          <button type="button" className="momentos-secondary" onClick={() => fileRef.current?.click()} disabled={!!ocupado}>
            {ocupado === 'importar' ? <LoaderCircle className="momentos-spin" size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />} IMPORTAR
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => { void importar(event.target.files?.[0]); event.target.value = ''; }} />
        {mensaje && <p className={`momentos-help-msg is-${mensaje.tipo}`} role="status">{mensaje.texto}</p>}
      </section>
    </div>
  );
}
