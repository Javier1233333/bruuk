import { useEffect, useRef, useState } from 'react';
import { Download, LoaderCircle, ShieldCheck, ShieldAlert, Upload, X } from 'lucide-react';
import { estaProtegido, pedirPersistencia } from './db';
import { exportarRespaldo, importarRespaldo } from './backup';
import { useSheet } from './useSheet';

// Momentos no sube nada a internet: si se pierde el teléfono, la copia es lo único que queda.
export function BackupSheet({ total, onClose }: { total: number; onClose: () => void }) {
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
      <section className="momentos-backup" role="dialog" aria-modal="true" aria-labelledby="momentos-backup-title" onClick={(event) => event.stopPropagation()}>
        <header className="momentos-sheet-head">
          <span id="momentos-backup-title">/ COPIA DE SEGURIDAD</span>
          <button type="button" className="momentos-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        </header>
        <div className="momentos-backup-body">
          <p>Tus momentos viven sólo en este teléfono. Guarda una copia para no perderlos o pasarlos a otro.</p>
          {protegido !== null && (
            <p className={`momentos-backup-status ${protegido ? 'is-ok' : ''}`}>
              {protegido
                ? <><ShieldCheck size={16} aria-hidden="true" /> El navegador no los borrará por falta de espacio.</>
                : <><ShieldAlert size={16} aria-hidden="true" /> Sin protección: si el teléfono se llena, podrían borrarse.</>}
            </p>
          )}
          <div className="momentos-backup-actions">
            <button type="button" className="momentos-primary" onClick={() => void exportar()} disabled={!!ocupado || total === 0}>
              {ocupado === 'exportar' ? <LoaderCircle className="momentos-spin" size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />} EXPORTAR COPIA
            </button>
            <button type="button" className="momentos-secondary" onClick={() => fileRef.current?.click()} disabled={!!ocupado}>
              {ocupado === 'importar' ? <LoaderCircle className="momentos-spin" size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />} IMPORTAR COPIA
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => { void importar(event.target.files?.[0]); event.target.value = ''; }} />
          {mensaje && <p className={`momentos-backup-msg is-${mensaje.tipo}`} role="status">{mensaje.texto}</p>}
        </div>
      </section>
    </div>
  );
}
