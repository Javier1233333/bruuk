import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Clock3, Coffee, Footprints, MapPin, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import './RadarCabanasPage.css';

const MUSEUM_URL = 'https://museocabanas.jalisco.gob.mx/';
const MUSEUM_ACCESS_URL = 'https://sic.cultura.gob.mx/ficha.php?table=museo&table_id=1027';
const MUSEUM_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Museo+Caba%C3%B1as+Guadalajara';
const MADOKA_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9+Madoka+Guadalajara';
const RIVEROLL_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Finca+Riveroll+Centro+Guadalajara';

export function RadarCabanasPage() {
  const entryRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    entryRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Museo Cabañas, café y redescubrimiento · Radar Bruuk';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const entry = entryRef.current;
    if (!entry) return;

    const updateProgress = () => {
      const isMobile = window.matchMedia('(max-width: 600px)').matches;
      const scrollableDistance = isMobile
        ? entry.scrollHeight - entry.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = isMobile ? entry.scrollTop : window.scrollY;
      const progress = scrollableDistance > 0 ? currentScroll / scrollableDistance : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    updateProgress();
    entry.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      entry.removeEventListener('scroll', updateProgress);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div ref={entryRef} className="cabanas-entry">
      <aside className="cabanas-entry-progress" aria-label="Progreso del artículo">
        <span>PROGRESO</span>
        <div
          className="cabanas-entry-progress-track"
          role="progressbar"
          aria-label="Progreso de lectura"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(scrollProgress * 100)}
        >
          <i style={{ transform: `scaleX(${scrollProgress})` }} />
        </div>
        <small>{Math.round(scrollProgress * 100)}%</small>
      </aside>
      <header className="cabanas-entry-nav">
        <Link to="/" aria-label="Volver al inicio de Bruuk"><BruukLogo width={96} /></Link>
        <div><span>/ RADAR BRUUK</span><strong>SEÑAL 002</strong></div>
        <Link to="/guadalajara/senales"><ArrowLeft size={16} /> VOLVER A SEÑALES</Link>
      </header>

      <main>
        <article>
          <header className="cabanas-entry-hero">
            <img src="/radar/cabanas/fachada-optimized.webp" alt="Vista del Paseo Hospicio hacia el Museo Cabañas en Guadalajara" decoding="async" />
            <div className="cabanas-entry-hero-shade" />
            <div className="cabanas-entry-hero-copy">
              <span>/ SEÑAL 002 · REDESCUBRIMIENTO</span>
              <h1>MUSEO CABAÑAS,<br /><em>CAFÉ Y VOLVER A MIRAR.</em></h1>
              <p>Un martes para volver al Cabañas, mirar los murales de Orozco y empezar el Centro desde una de sus partes más hermosas.</p>
              <div><span>POR JAVIER FREGOSO</span><span>GDL · CENTRO</span><span>AGOSTO 2026</span></div>
              <a href="#entrada">ABRIR LA SEÑAL <ArrowDownRight size={19} /></a>
            </div>
            <div className="cabanas-entry-hero-mark" aria-hidden="true"><Radio /><strong>002</strong></div>
          </header>

          <section className="cabanas-entry-lead" id="entrada">
            <span>/ LA IDEA</span>
            <p>A VECES PENSAMOS QUE EL CENTRO ES FEO, COMPLICADO O QUE SUS ESPACIOS NO SON PARA NOSOTROS. VOLVER AL CABAÑAS ES UNA FORMA DE EMPEZAR POR LO MÁS HERMOSO DE LA CIUDAD.</p>
          </section>

          <section className="cabanas-entry-chapter cabanas-entry-museum" aria-labelledby="cabanas-museum-title">
            <div className="cabanas-entry-chapter-number">01</div>
            <div className="cabanas-entry-chapter-copy">
              <span>/ EMPIEZA MIRANDO HACIA ARRIBA</span>
              <h2 id="cabanas-museum-title">EL CABAÑAS NO SE RECORRE CON PRISA.</h2>
              <p>A veces también sentimos que los museos no son para nosotros. El Cabañas rompe esa idea desde los patios: puedes entrar, caminar y mirar sin saber de arte ni tener que entenderlo todo.</p>
              <p>Después está la Capilla Mayor y los 57 frescos de José Clemente Orozco. En la cúpula, <em>El Hombre de Fuego</em> obliga a detenerse, girar y mirar más de una vez. Hay más exposiciones en el resto del museo; pregunta qué salas están abiertas y recórrelas antes de irte.</p>
              <p>La recomendación es sencilla: ve un martes. La entrada es libre y el plan deja de necesitar otra justificación.</p>
              <div className="cabanas-entry-facts">
                <span><Clock3 size={17} /><b>MARTES</b> ENTRADA LIBRE</span>
                <span><Clock3 size={17} /><b>MAR—DOM</b> 10:00—17:00</span>
                <span><MapPin size={17} /><b>CABAÑAS 8</b> PLAZA TAPATÍA</span>
              </div>
              <div className="cabanas-entry-source-links">
                <a href={MUSEUM_URL} target="_blank" rel="noreferrer">REVISAR EXPOSICIONES <ArrowUpRight size={17} /></a>
                <a href={MUSEUM_ACCESS_URL} target="_blank" rel="noreferrer">CONFIRMAR ACCESO DEL MARTES <ArrowUpRight size={17} /></a>
              </div>
            </div>
            <figure>
              <img src="/radar/cabanas/cupula.jpg" alt="Detalle exterior de la cúpula del Museo Cabañas" loading="lazy" />
              <figcaption>CÚPULA DEL MUSEO CABAÑAS · FOTO: SERGIOYALU / WIKIMEDIA COMMONS · CC BY-SA 4.0</figcaption>
            </figure>
          </section>

          <blockquote className="cabanas-entry-quote">
            <span>“</span>
            <p>ES BONITO VOLVER A LOS ESPACIOS QUE CREÍAMOS AJENOS Y DESCUBRIR QUE TAMBIÉN ERAN PARA NOSOTROS.</p>
          </blockquote>

          <section className="cabanas-entry-chapter cabanas-entry-coffee" aria-labelledby="cabanas-coffee-title">
            <div className="cabanas-entry-chapter-number">02</div>
            <figure>
              <img src="/radar/cabanas/cafe.jpg" alt="Taza de café fotografiada en Guadalajara" loading="lazy" />
              <figcaption>PAUSA DE CAFÉ EN GUADALAJARA · FOTO: SUMMER TIME / UNSPLASH</figcaption>
            </figure>
            <div className="cabanas-entry-chapter-copy">
              <span>/ DOS FORMAS DE TERMINAR LA CAMINATA</span>
              <h2 id="cabanas-coffee-title">UN CAFÉ LOCAL DESPUÉS DEL MUSEO.</h2>
              <p>No hace falta salir del Centro en cuanto termina la visita. Camina hacia el poniente y elige una de estas dos pausas según el tipo de tarde que quieras.</p>
              <div className="cabanas-entry-cafe-options">
                <article>
                  <strong>01 · CAFÉ MADOKA</strong>
                  <p>Para continuar en un Guadalajara más clásico: mesas sin prisa, comida tradicional y un ambiente que no intenta parecer nuevo. Es la opción si quieres sentarte un buen rato.</p>
                  <a href={MADOKA_MAP_URL} target="_blank" rel="noreferrer">ABRIR EN MAPS <ArrowUpRight size={16} /></a>
                </article>
                <article>
                  <strong>02 · FINCA RIVEROLL</strong>
                  <p>Para alargar la caminata hasta el andador Coronilla y cerrar con una taza más enfocada en el café. Funciona mejor si todavía quieres seguir viendo el Centro a pie.</p>
                  <a href={RIVEROLL_MAP_URL} target="_blank" rel="noreferrer">ABRIR EN MAPS <ArrowUpRight size={16} /></a>
                </article>
              </div>
            </div>
          </section>

          <section className="cabanas-entry-rediscover" aria-labelledby="cabanas-rediscover-title">
            <header>
              <span>/ 03 · EL REGRESO</span>
              <h2 id="cabanas-rediscover-title">SALIR DEL MUSEO.<br />VOLVER A ENTRAR A LA CIUDAD.</h2>
            </header>
            <div className="cabanas-entry-rediscover-grid">
              <p>El Centro puede sentirse ruidoso, descuidado o difícil desde lejos. Esta ruta no intenta negar eso. Propone entrar por otro lado: empezar con los patios del Cabañas, mirar algo extraordinario y luego caminar la ciudad con una primera impresión distinta.</p>
              <ol>
                <li><span>01</span><div><strong>MUSEO CABAÑAS</strong><small>ARQUITECTURA · OROZCO · SILENCIO</small></div></li>
                <li><span>02</span><div><strong>CAMINAR EL CENTRO</strong><small>PLAZA TAPATÍA · PASAJES · COMERCIO</small></div></li>
                <li><span>03</span><div><strong>CAFÉ LOCAL</strong><small>MADOKA O FINCA RIVEROLL</small></div></li>
              </ol>
            </div>
          </section>

          <section className="cabanas-entry-plan" aria-labelledby="cabanas-plan-title">
            <span>/ PARA HACERLO</span>
            <h2 id="cabanas-plan-title">UNA MAÑANA.<br />TRES FORMAS DE MIRAR.</h2>
            <div>
              <span><Clock3 /><b>3—4 HORAS</b> SIN PRISA</span>
              <span><Footprints /><b>A PIE</b> POR EL CENTRO</span>
              <span><Coffee /><b>1 PAUSA</b> ANTES DE VOLVER</span>
            </div>
            <nav aria-label="Abrir ubicaciones del recorrido">
              <a href={MUSEUM_MAP_URL} target="_blank" rel="noreferrer">MUSEO EN MAPA <ArrowUpRight size={17} /></a>
              <a href={MADOKA_MAP_URL} target="_blank" rel="noreferrer">MADOKA EN MAPA <ArrowUpRight size={17} /></a>
              <a href={RIVEROLL_MAP_URL} target="_blank" rel="noreferrer">RIVEROLL EN MAPA <ArrowUpRight size={17} /></a>
            </nav>
          </section>
        </article>

        <section className="cabanas-entry-outro" aria-labelledby="cabanas-outro-title">
          <div><span>/ SIGUE EXPLORANDO</span><h2 id="cabanas-outro-title">¿QUIERES MÁS<br />PLANES Y SPOTS?</h2></div>
          <div><p>Continúa en el feed general de Bruuk para descubrir más lugares y planes seleccionados en Guadalajara.</p><Link to="/guadalajara/spots">ABRIR EL FEED <ArrowUpRight size={18} /></Link></div>
        </section>

        <footer className="cabanas-entry-footer">
          <Link to="/guadalajara/senales"><ArrowLeft size={16} /> VOLVER A SEÑALES</Link>
          <p>CRÉDITOS: ELPATTMEDINA Y SERGIOYALU / WIKIMEDIA COMMONS · SUMMER TIME / UNSPLASH</p>
        </footer>
      </main>
    </div>
  );
}
