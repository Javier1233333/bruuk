import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Clock3, Coffee, Disc3, Footprints, MapPin, Radio, TrainFront, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import './RadarCabanasPage.css';
import './RadarMazRoutePage.css';

const MAZ_URL = 'https://maz.zapopan.gob.mx/';
const MAZ_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Museo+de+Arte+de+Zapopan';
const AMORCITO_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Amorcito+Mio+Zapopan+Centro';
const HOSTERIA_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Hosteria+del+Angel+Zapopan+Centro';
const BINAURAL_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Binaural+Cafe+Javier+Mina+311+Zapopan';
const GUFO_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Gufo+Cafe+Zapopan+Centro';
const ESTACION_MAZ_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Estacion+MAZ+Zapopan';
const FULL_ROUTE_URL = 'https://www.google.com/maps/dir/?api=1&origin=Amorcito+Mio+Zapopan+Centro&destination=Estacion+MAZ+Zapopan&waypoints=Museo+de+Arte+de+Zapopan%7CBinaural+Cafe+Javier+Mina+311+Zapopan&travelmode=walking';

export function RadarMazRoutePage() {
  const routeRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const wheelResetRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    routeRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'MAZ y una vuelta por el Centro de Zapopan · Radar Bruuk';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const route = routeRef.current;
    if (!route) return;

    const updateProgress = () => {
      const isMobile = window.matchMedia('(max-width: 600px)').matches;
      const scrollableDistance = isMobile
        ? route.scrollHeight - route.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = isMobile ? route.scrollTop : window.scrollY;
      const nextProgress = scrollableDistance > 0 ? currentScroll / scrollableDistance : 0;
      setScrollProgress(Math.min(1, Math.max(0, nextProgress)));

      const cards = Array.from(route.querySelectorAll<HTMLElement>('.maz-route-snap-card'));
      const viewportTop = currentScroll + (isMobile ? 70 : 76);
      const nearestIndex = cards.reduce((bestIndex, card, index) => (
        Math.abs(card.offsetTop - viewportTop) < Math.abs(cards[bestIndex].offsetTop - viewportTop)
          ? index
          : bestIndex
      ), 0);
      setActiveCardIndex(nearestIndex);
    };

    updateProgress();
    route.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      route.removeEventListener('scroll', updateProgress);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  useEffect(() => {
    const route = routeRef.current;
    if (!route) return;

    const handleWheel = (event: WheelEvent) => {
      if (!window.matchMedia('(max-width: 600px)').matches) return;
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (wheelLockRef.current) return;

      wheelDeltaRef.current += event.deltaY;
      if (wheelResetRef.current !== null) window.clearTimeout(wheelResetRef.current);
      wheelResetRef.current = window.setTimeout(() => { wheelDeltaRef.current = 0; }, 140);
      if (Math.abs(wheelDeltaRef.current) < 28) return;

      const cards = Array.from(route.querySelectorAll<HTMLElement>('.maz-route-snap-card'));
      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(cards.length - 1, activeCardIndex + direction));
      wheelDeltaRef.current = 0;
      if (nextIndex === activeCardIndex) return;

      wheelLockRef.current = true;
      route.scrollTo({ top: Math.max(0, cards[nextIndex].offsetTop - 70), behavior: 'smooth' });
      window.setTimeout(() => { wheelLockRef.current = false; }, 620);
    };

    route.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      route.removeEventListener('wheel', handleWheel);
      if (wheelResetRef.current !== null) window.clearTimeout(wheelResetRef.current);
    };
  }, [activeCardIndex]);

  return (
    <div ref={routeRef} className="cabanas-entry maz-route-entry">
      <aside className="maz-route-scroll-guide" aria-label="Progreso del recorrido">
        <span className="maz-route-scroll-label-desktop">PROGRESO DE LA RUTA</span>
        <span className="maz-route-scroll-label-mobile">DESLIZA PARA SEGUIR</span>
        <div
          className="maz-route-scroll-track"
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
        <div><span>/ RADAR BRUUK</span><strong>SEÑAL 003</strong></div>
        <Link to="/guadalajara/senales"><ArrowLeft size={16} /> VOLVER A SEÑALES</Link>
      </header>

      <main>
        <article>
          <header className="cabanas-entry-hero maz-route-hero maz-route-snap-card">
            <img src="/radar/maz-route/maz.jpg" alt="Entrada del Museo de Arte de Zapopan" />
            <div className="cabanas-entry-hero-shade" />
            <div className="cabanas-entry-hero-copy">
              <span>/ SEÑAL 003 · REDESCUBRIR ZAPOPAN</span>
              <h1>EL MAZ Y UNA VUELTA<br /><em>SIN PRISA POR EL CENTRO.</em></h1>
              <p>Desayunar, ver qué está pasando en el museo y dejar que la calle peatonal decida el resto.</p>
              <div><span>POR JAVIER FREGOSO</span><span>ZAPOPAN · CENTRO</span><span>AGOSTO 2026</span></div>
              <a href="#ruta">EMPEZAR LA RUTA <ArrowDownRight size={19} /></a>
            </div>
            <div className="cabanas-entry-hero-mark" aria-hidden="true"><Radio /><strong>003</strong></div>
          </header>

          <section className="cabanas-entry-lead maz-route-lead maz-route-snap-card" id="ruta">
            <span>/ POR QUÉ ESTA RUTA</span>
            <p>SOY FANÁTICO DE REDESCUBRIR MI CIUDAD. ARMÉ ESTE RECORRIDO PARA QUIENES TODAVÍA NO SE HAN DADO UNA VUELTA POR EL CENTRO RENOVADO DE ZAPOPAN.</p>
          </section>

          <section className="cabanas-entry-chapter maz-route-stop maz-route-text-stop maz-route-snap-card" aria-labelledby="maz-breakfast-title">
            <div className="cabanas-entry-chapter-number">01</div>
            <div className="cabanas-entry-chapter-copy">
              <span>/ ANTES DE QUE ABRA EL MUSEO</span>
              <h2 id="maz-breakfast-title">EMPIEZA CON ALGO DE DESAYUNAR.</h2>
              <p><strong>Amorcito Mío</strong> es mi opción para arrancar con uno de sus sándwiches. Si llegas más tarde, también funciona para sentarte a comer una pizza.</p>
              <p>Si prefieres un desayuno mexicano más tradicional, cambia la primera parada por <strong>Hostería del Ángel</strong>. No hay una respuesta correcta: elige según la hora y el antojo.</p>
              <div className="cabanas-entry-facts">
                <span><Utensils size={17} /><b>DOS OPCIONES</b> SEGÚN TU ANTOJO</span>
                <span><Clock3 size={17} /><b>LLEGA TEMPRANO</b> ANTES DEL MAZ</span>
              </div>
              <nav className="maz-route-inline-links" aria-label="Opciones para desayunar">
                <a href={AMORCITO_MAP_URL} target="_blank" rel="noreferrer">AMORCITO MÍO <ArrowUpRight size={17} /></a>
                <a href={HOSTERIA_MAP_URL} target="_blank" rel="noreferrer">HOSTERÍA DEL ÁNGEL <ArrowUpRight size={17} /></a>
              </nav>
            </div>
          </section>

          <section className="maz-route-museum maz-route-snap-card" aria-labelledby="maz-museum-title">
            <div>
              <span>/ 02 · EL PUNTO DE PARTIDA</span>
              <h2 id="maz-museum-title">RECORRE TODO LO QUE<br />ESTÉ ABIERTO EN EL MAZ.</h2>
            </div>
            <div className="maz-route-museum-grid">
              <div className="maz-route-museum-copy">
                <p>Me gusta empezar por el MAZ y revisar qué exposiciones están disponibles ese día. El museo tiene varias áreas: vale la pena preguntar al personal y dejar que te guíe si es tu primera visita.</p>
                <p>No te quedes solamente con la primera sala. Explora todos los espacios que estén habilitados y pregunta si existe alguna sección que no hayas visto.</p>
              </div>
              <div className="cabanas-entry-facts">
                <span><MapPin size={17} /><b>MAZ</b> ZAPOPAN CENTRO</span>
                <span><Radio size={17} /><b>EXPOSICIONES TEMPORALES</b> REVISA ANTES DE IR</span>
                <a href={MAZ_URL} target="_blank" rel="noreferrer">VER QUÉ ESTÁ EXPUESTO AHORA <ArrowUpRight size={17} /></a>
                <a href={MAZ_MAP_URL} target="_blank" rel="noreferrer">ABRIR EL MAZ EN MAPS <ArrowUpRight size={17} /></a>
              </div>
            </div>
          </section>

          <section className="maz-route-museum maz-route-exhibit maz-route-snap-card" aria-labelledby="maz-exhibit-title">
            <div>
              <span>/ 02 · UNA EXPOSICIÓN QUE SE QUEDÓ CONMIGO</span>
              <h2 id="maz-exhibit-title">1 GOTA DE LLUVIA<br />SOBRE EL POLVO.</h2>
            </div>
            <div className="maz-route-museum-grid">
              <div className="maz-route-museum-copy">
                <p>La exposición que a mí me voló la cabeza fue <em>Carmen Huízar: 1 gota de lluvia sobre el polvo</em>. No la menciono como promesa de que seguirá montada cuando vayas, sino como ejemplo de por qué conviene entrar sin asumir qué vas a encontrar.</p>
                <p>Las exposiciones cambian. Esa es una buena razón para volver al MAZ aunque ya lo conozcas.</p>
              </div>
              <div className="cabanas-entry-facts">
                <span><Radio size={17} /><b>MI REFERENCIA</b> CARMEN HUÍZAR</span>
                <span><Clock3 size={17} /><b>ANTES DE IR</b> REVISA LA CARTELERA ACTUAL</span>
                <a href={MAZ_URL} target="_blank" rel="noreferrer">CONSULTAR CARTELERA <ArrowUpRight size={17} /></a>
              </div>
            </div>
          </section>

          <blockquote className="cabanas-entry-quote maz-route-quote maz-route-snap-card">
            <span>“</span>
            <p>NO SALGAS DEL MUSEO BUSCANDO LA SIGUIENTE PARADA EN EL TELÉFONO. CAMINA LA CALLE PEATONAL Y ENTRA A UN LUGAR QUE TE DÉ CURIOSIDAD.</p>
          </blockquote>

          <section className="cabanas-entry-chapter cabanas-entry-coffee maz-route-stop maz-route-snap-card" aria-labelledby="maz-binaural-title">
            <div className="cabanas-entry-chapter-number">03</div>
            <figure>
              <img src="/radar/maz-route/binaural.jpg" alt="Barra e interior de Binaural Café en Zapopan" loading="lazy" />
              <figcaption>BINAURAL CAFÉ · FOTO VÍA CORNER / GOOGLE CONTRIBUTORS</figcaption>
            </figure>
            <div className="cabanas-entry-chapter-copy">
              <span>/ LA CALLE PEATONAL Y UNA PAUSA</span>
              <h2 id="maz-binaural-title">CAFÉ, VINILOS Y TIEMPO PARA QUEDARSE.</h2>
              <p>Al salir del MAZ, aprovecha para caminar por la calle peatonal, una de las zonas más vivas del área metropolitana. Mi recomendación especial es <strong>Binaural Café</strong>: combina café y vinilos sin sentirse como un concepto de aparador.</p>
              <p>Puedes pedir para llevar, pero yo me daría la oportunidad de quedarme. Escoge el vinilo que más te guste en la barra; ahí te dejan ponerlo mientras tomas el café.</p>
              <div className="cabanas-entry-facts">
                <span><Disc3 size={17} /><b>ELIGE UN VINILO</b> Y PONLO EN LA BARRA</span>
                <span><Coffee size={17} /><b>PARA LLEVAR O QUEDARTE</b> YO ME QUEDARÍA</span>
              </div>
              <nav className="maz-route-inline-links" aria-label="Opciones de café">
                <a href={BINAURAL_MAP_URL} target="_blank" rel="noreferrer">BINAURAL CAFÉ <ArrowUpRight size={17} /></a>
              </nav>
            </div>
          </section>

          <section className="cabanas-entry-chapter maz-route-stop maz-route-text-stop maz-route-snap-card" aria-labelledby="maz-gufo-title">
            <div className="cabanas-entry-chapter-number">03 / B</div>
            <div className="cabanas-entry-chapter-copy">
              <span>/ SI BINAURAL NO ES TU PARADA</span>
              <h2 id="maz-gufo-title">ENTRA A GUFO.<br />O SIGUE CAMINANDO.</h2>
              <p>Otra opción es <strong>Gufo Café</strong>, que abrió aquí su segunda sucursal después de la de avenida Chapultepec, dentro de la Librería del Fondo de Cultura Económica.</p>
              <p>Pero la regla más importante es otra: no tienes que obedecer esta lista. La calle peatonal está viva; entra a cualquier comercio que te dé curiosidad y deja que esa sea tu parada.</p>
              <div className="cabanas-entry-facts">
                <span><Coffee size={17} /><b>ALTERNATIVA</b> GUFO CAFÉ</span>
                <span><Footprints size={17} /><b>SIN CHECKLIST</b> EXPLORA LA CALLE</span>
              </div>
              <nav className="maz-route-inline-links" aria-label="Abrir Gufo Café">
                <a href={GUFO_MAP_URL} target="_blank" rel="noreferrer">GUFO CAFÉ EN MAPS <ArrowUpRight size={17} /></a>
              </nav>
            </div>
          </section>

          <section className="maz-route-museum maz-route-station maz-route-snap-card" aria-labelledby="maz-station-title">
            <div>
              <span>/ 04 · LA SEGUNDA PARTE DEL MAZ</span>
              <h2 id="maz-station-title">ESTACIÓN MAZ.<br />TODAVÍA NO TERMINA.</h2>
            </div>
            <div className="maz-route-museum-grid">
              <div className="maz-route-museum-copy">
                <p>Después iría a <strong>Estación MAZ</strong>, junto a la estación del tren y los Arcos de Zapopan. Aquí también montan exposiciones muy buenas; algunas incluso trabajan con elementos sensoriales.</p>
                <p>Antes de salir, revisa el lobby. Hay una tienda y una mesa para jugar ajedrez. No es un trámite al final del recorrido: es otro espacio para detenerte.</p>
              </div>
              <div className="cabanas-entry-facts">
                <span><TrainFront size={17} /><b>JUNTO AL TREN</b> Y LOS ARCOS</span>
                <span><Footprints size={17} /><b>LOBBY</b> TIENDA + AJEDREZ</span>
                <a href={ESTACION_MAZ_MAP_URL} target="_blank" rel="noreferrer">ABRIR ESTACIÓN MAZ EN MAPS <ArrowUpRight size={17} /></a>
              </div>
            </div>
          </section>

          <section className="cabanas-entry-plan maz-route-snap-card" aria-labelledby="maz-plan-title">
            <span>/ LA RUTA, SIN HACERLA CHECKLIST</span>
            <h2 id="maz-plan-title">DESAYUNA.<br />MIRA. CAMINA. ENTRA.</h2>
            <div>
              <span><Clock3 /><b>UNA MAÑANA</b> SIN MEDIR CADA PARADA</span>
              <span><Footprints /><b>A PIE</b> POR EL CENTRO</span>
              <span><Radio /><b>2 ESPACIOS MAZ</b> Y LO QUE ENCUENTRES</span>
            </div>
            <p className="maz-route-plan-note">Si entras a cualquier lugar de la zona, hazlo con ganas de explorar. La ruta sirve para empezar; el Centro de Zapopan hace el resto.</p>
            <nav aria-label="Abrir el recorrido y sus ubicaciones">
              <a href={FULL_ROUTE_URL} target="_blank" rel="noreferrer">ABRIR RUTA BASE <ArrowUpRight size={17} /></a>
              <a href={MAZ_URL} target="_blank" rel="noreferrer">REVISAR EXPOSICIONES <ArrowUpRight size={17} /></a>
            </nav>
          </section>
        </article>

        <section className="cabanas-entry-outro maz-route-snap-card" aria-labelledby="maz-outro-title">
          <div><span>/ SIGUE EXPLORANDO</span><h2 id="maz-outro-title">¿QUIERES MÁS<br />PLANES Y SPOTS?</h2></div>
          <div><p>Continúa en Bruuk para encontrar más lugares seleccionados y otras formas de recorrer Guadalajara.</p><Link to="/guadalajara/spots">ABRIR SPOTS <ArrowUpRight size={18} /></Link></div>
        </section>

        <footer className="cabanas-entry-footer">
          <Link to="/guadalajara/senales"><ArrowLeft size={16} /> VOLVER A SEÑALES</Link>
          <p>RUTA Y TEXTO: JAVIER FREGOSO · MAZ: FOTO TANIA SOLÁ (WMMX) / WIKIMEDIA COMMONS · CC BY 4.0 · BINAURAL: FOTO VÍA CORNER / GOOGLE CONTRIBUTORS</p>
        </footer>
      </main>
    </div>
  );
}
