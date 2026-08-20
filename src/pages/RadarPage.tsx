import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type WheelEvent } from 'react';
import { ArrowRight, ArrowUpRight, Coffee, Crosshair, Radio, Route, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import { RegistrationModal } from '../components/RegistrationModal';
import './RadarPage.css';

const CELL_POSITIONS = [-1, 0, 1, 2];

type CanvasMetrics = {
  width: number;
  height: number;
  initial: { x: number; y: number };
};

function getCanvasMetrics(): CanvasMetrics {
  if (window.matchMedia('(max-width: 600px)').matches) {
    return { width: 900, height: 1500, initial: { x: -10, y: -70 } };
  }
  return { width: 1800, height: 1260, initial: { x: -130, y: -90 } };
}

function wrapAxis(value: number, size: number) {
  return ((value % size) + size) % size - size;
}

export function RadarPage() {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [metrics, setMetrics] = useState<CanvasMetrics>(() => getCanvasMetrics());
  const [view, setView] = useState(() => getCanvasMetrics().initial);
  const drag = useRef({ pointerId: -1, x: 0, y: 0, moved: false });
  const isMobileLayout = metrics.width === 900;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Radar Bruuk · Archivo infinito de Guadalajara';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const syncCanvas = () => {
      const next = getCanvasMetrics();
      setMetrics((current) => {
        if (current.width === next.width && current.height === next.height) return current;
        setView(next.initial);
        return next;
      });
    };
    window.addEventListener('resize', syncCanvas);
    return () => window.removeEventListener('resize', syncCanvas);
  }, []);

  const moveView = (deltaX: number, deltaY: number) => {
    setView((current) => ({
      x: wrapAxis(current.x + deltaX, metrics.width),
      y: wrapAxis(current.y + deltaY, metrics.height),
    }));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isMobileLayout) return;
    if (event.button !== 0) return;
    if ((event.target as Element).closest('a, button')) {
      drag.current.moved = false;
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isMobileLayout) return;
    if (drag.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.current.x;
    const deltaY = event.clientY - drag.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) drag.current.moved = true;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    moveView(deltaX, deltaY);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== event.pointerId) return;
    drag.current.pointerId = -1;
    setIsDragging(false);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (isMobileLayout) return;
    event.preventDefault();
    const horizontal = event.deltaX || (event.shiftKey ? event.deltaY : 0);
    const vertical = event.shiftKey ? 0 : event.deltaY;
    moveView(-horizontal, -vertical);
  };

  const blockClickAfterDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (isMobileLayout) {
      drag.current.moved = false;
      return;
    }
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  };

  return (
    <div className="radar-page">
      <header className="radar-page-nav">
        <Link to="/" aria-label="Volver al landing de Bruuk"><BruukLogo width={96} /></Link>
        <div className="radar-page-nav-title"><span>/ ARCHIVO INFINITO</span><strong>RADAR BRUUK</strong></div>
        <button type="button" onClick={() => setIsJoinOpen(true)}>UNIRME <Radio size={15} /></button>
      </header>

      <main className="radar-infinity-shell">
        <div className="radar-infinity-topline">
          <span>RADAR / GUADALAJARA</span>
          <span>03 SEÑALES · ARCHIVO EN CRECIMIENTO</span>
        </div>

        <div
          className={`radar-infinity-viewport ${isDragging ? 'is-dragging' : ''}`}
          aria-label={isMobileLayout
            ? 'Señales de Radar. Desliza hacia abajo para explorar.'
            : 'Archivo infinito de señales de Radar. Arrastra para explorar en cualquier dirección.'}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onWheel={handleWheel}
          onClickCapture={blockClickAfterDrag}
        >
          <div className="radar-infinity-world" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0)` }}>
            {CELL_POSITIONS.flatMap((row) => CELL_POSITIONS.map((column) => {
              const isPrimary = row === 0 && column === 0;
              const tabIndex = isPrimary ? undefined : -1;
              return (
                <section
                  className="radar-infinity-cell"
                  style={{ left: column * metrics.width, top: row * metrics.height }}
                  aria-hidden={!isPrimary}
                  key={`${row}-${column}`}
                >
                  <div className="radar-infinity-wordmark" aria-hidden="true">
                    <span>SEÑALES DE</span><strong>RADAR.</strong>
                  </div>

                  <Link className="radar-canvas-card radar-canvas-cabanas" to="/radar/museo-cabanas-cafe-redescubrimiento" tabIndex={tabIndex}>
                    <img src="/radar/cabanas/fachada.jpg" alt={isPrimary ? 'Vista hacia el Museo Cabañas desde Paseo Hospicio' : ''} draggable="false" />
                    <div className="radar-canvas-photo-shade" />
                    <span>SEÑAL 002 · CRÓNICA</span>
                    <h2>CABAÑAS,<br />CAFÉ Y VOLVER<br />A MIRAR.</h2>
                    <strong>ABRIR <ArrowUpRight /></strong>
                  </Link>

                  <Link className="radar-canvas-card radar-canvas-route" to="/guadalajara/ruta-museos" tabIndex={tabIndex}>
                    <div><span>SEÑAL 001</span><Route /></div>
                    <h2>¿QUIERES IR<br />A UN MUSEO?</h2>
                    <p>Diez museos y espacios culturales para elegir según lo que quieras ver.</p>
                    <strong>VER OPCIONES <ArrowUpRight /></strong>
                  </Link>

                  <button className="radar-canvas-card radar-canvas-community" type="button" onClick={() => setIsJoinOpen(true)} tabIndex={tabIndex}>
                    <Radio />
                    <span>/ COMUNIDAD RADAR</span>
                    <h2>RECÍBELO<br />ANTES QUE NADIE.</h2>
                    <strong>UNIRME <ArrowRight /></strong>
                  </button>

                  <Link className="radar-canvas-card radar-canvas-upcoming radar-canvas-maz" to="/radar/maz-desayuno-cafe-zapopan" tabIndex={tabIndex}>
                    <img src="/radar/maz-route/maz.jpg" alt={isPrimary ? 'Entrada del Museo de Arte de Zapopan' : ''} draggable="false" />
                    <div className="radar-canvas-photo-shade" />
                    <div><span>SEÑAL 003</span><Sparkles /></div>
                    <small>RUTA / ZAPOPAN CENTRO</small>
                    <h2>EL MAZ + UNA<br />VUELTA SIN PRISA.</h2>
                    <strong>ABRIR <ArrowUpRight /></strong>
                  </Link>

                  <div className="radar-canvas-note" aria-hidden="true">
                    <Coffee />
                    <span>RESEÑAS · RUTAS<br />APERTURAS · CULTURA LOCAL</span>
                  </div>
                </section>
              );
            }))}
          </div>
        </div>

        <div className="radar-infinity-help" aria-hidden="true"><span>ARRASTRA PARA EXPLORAR</span><span>RUEDA / TRACKPAD / TOUCH</span></div>
        <button className="radar-infinity-reset" type="button" onClick={() => setView(metrics.initial)}><Crosshair size={17} /> CENTRAR</button>
      </main>

      <RegistrationModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}
