import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Landmark,
  MapPin,
  PanelsTopLeft,
} from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import './MuseumRoutePage.css';

type MuseumOption = {
  number: string;
  type: 'museo' | 'galeria' | 'sede';
  name: string;
  area: string;
  address: string;
  hours: string;
  cue: string;
  description: string;
  color: string;
  mapUrl: string;
  websiteUrl?: string;
};

const MUSEUMS: MuseumOption[] = [
  {
    number: '01',
    type: 'museo',
    name: 'MUSEO CABAÑAS',
    area: 'CENTRO',
    address: 'Cabañas 8 · Plaza Tapatía',
    hours: 'Mar–dom · 10:00–17:00',
    cue: 'OROZCO / ARQUITECTURA / TEMPORALES',
    description:
      'Ve si quieres pintura mural y un edificio que también es parte de la visita. Aquí están los murales de José Clemente Orozco, incluido El Hombre de Fuego, además de exposiciones temporales de arte moderno y contemporáneo.',
    color: 'violet',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Museo+Caba%C3%B1as+Guadalajara',
    websiteUrl: 'https://museocabanas.jalisco.gob.mx/',
  },
  {
    number: '02',
    type: 'museo',
    name: 'MUSEO DE LA CIUDAD',
    area: 'CENTRO',
    address: 'Independencia 684 · Centro',
    hours: 'Mar–sáb · 10:00–17:30',
    cue: 'HISTORIA / BARRIOS / VIDA TAPATÍA',
    description:
      'Esta es la opción para entender Guadalajara. Sus salas hablan de la historia, el crecimiento urbano, los barrios, las costumbres y el arte de la ciudad; también tiene exposiciones temporales que cambian durante el año.',
    color: 'orange',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Museo+de+la+Ciudad+de+Guadalajara',
  },
  {
    number: '03',
    type: 'museo',
    name: 'MUSA',
    area: 'AMERICANA',
    address: 'Av. Juárez 975 · Americana',
    hours: 'Mar–sáb · 10:00–18:00 · Dom hasta 15:00',
    cue: 'ARTE / OROZCO / UNIVERSIDAD',
    description:
      'Buena opción si quieres una mezcla: exposiciones de arte moderno y contemporáneo, una colección con artistas de Jalisco, México y otros países, y dos murales de Orozco dentro del Paraninfo de la Universidad de Guadalajara.',
    color: 'green',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=MUSA+Museo+de+las+Artes+Guadalajara',
    websiteUrl: 'https://www.musaudg.mx/',
  },
  {
    number: '04',
    type: 'museo',
    name: 'MUSEO DE PALEONTOLOGÍA',
    area: 'AGUA AZUL',
    address: 'Av. Dr. R. Michel 520 · San Carlos',
    hours: 'Mar–vie · 9:30–16:45 · Fin de semana con horario corto',
    cue: 'FÓSILES / GEOLOGÍA / JALISCO PREHISTÓRICO',
    description:
      'Aquí el tema es la vida de hace miles de años en el occidente de México. Exhibe fósiles de flora y fauna, huesos de animales prehistóricos, rocas y minerales de la colección reunida por Federico A. Solórzano Barreto.',
    color: 'blue',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Museo+de+Paleontolog%C3%ADa+de+Guadalajara+Federico+Sol%C3%B3rzano',
  },
  {
    number: '05',
    type: 'museo',
    name: 'MURA',
    area: 'MODERNA',
    address: 'Mariano Otero 375 · Moderna',
    hours: 'Mar–sáb · 10:00–17:00',
    cue: 'RAÚL ANGUIANO / ARTE ACTUAL / EMERGENTES',
    description:
      'El Museo Raúl Anguiano conserva y difunde la obra del artista jalisciense, pero no se queda en una sala histórica. Su programa incluye exposiciones temporales de arte contemporáneo y proyectos de artistas emergentes.',
    color: 'pink',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Museo+Ra%C3%BAl+Anguiano+MURA+Guadalajara',
  },
  {
    number: '06',
    type: 'museo',
    name: 'MAZ',
    area: 'ZAPOPAN CENTRO',
    address: 'Andador 20 de Noviembre 166 · Zapopan',
    hours: 'Mar–dom · 10:00–18:00 · Jue hasta 22:00',
    cue: 'ARTE CONTEMPORÁNEO / PROYECTOS / COMUNIDAD',
    description:
      'El Museo de Arte de Zapopan está dedicado por completo al arte contemporáneo. Presenta exposiciones temporales, colecciones invitadas y proyectos creados para sus propias salas, muchas veces conectados con temas sociales y con la comunidad.',
    color: 'yellow',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Museo+de+Arte+de+Zapopan+MAZ',
    websiteUrl: 'https://maz.zapopan.gob.mx/',
  },
  {
    number: '07',
    type: 'sede',
    name: 'ESTACIÓNMAZ',
    area: 'ZAPOPAN CENTRO',
    address: 'Av. Hidalgo 352 · Zapopan',
    hours: 'Mar–dom · 10:00–18:00 · Jue hasta 22:00',
    cue: 'EXPERIMENTAL / INSTALACIÓN / SENSORIAL',
    description:
      'Es la segunda sede del MAZ, no otra sala dentro del edificio principal. Su escala se presta para muestras más concentradas, instalaciones y proyectos experimentales o sensoriales. La entrada, igual que en el MAZ, es gratuita.',
    color: 'violet',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Estaci%C3%B3nMAZ+Zapopan',
    websiteUrl: 'https://maz.zapopan.gob.mx/planea-una-visita/',
  },
  {
    number: '08',
    type: 'galeria',
    name: 'PLATAFORMA',
    area: 'AMERICANA',
    address: 'Av. Vallarta 1246 · Americana',
    hours: 'Mié–sáb · 11:00–19:00 · Dom 9:00–17:00',
    cue: 'ARTE CONTEMPORÁNEO / COLECCIÓN SURO / PACÍFICO',
    description:
      'Es un espacio independiente de arte contemporáneo, no un museo tradicional. Presenta exposiciones temporales con atención especial a artistas de Jalisco y la costa del Pacífico; en su segundo nivel también desarrolla proyectos a partir de la Colección Suro, formada por más de 700 obras.',
    color: 'blue',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Plataforma+Arte+Contempor%C3%A1neo+Vallarta+1246+Guadalajara',
    websiteUrl: 'https://www.plac.mx/',
  },
  {
    number: '09',
    type: 'museo',
    name: 'JOVEM',
    area: 'ESTADIO AKRON',
    address: 'Av. Circuito JVC 2800 · Zapopan',
    hours: 'Mar–dom · consulta horario y boletos antes de ir',
    cue: 'ARTE / TECNOLOGÍA / EXPERIENCIA INMERSIVA',
    description:
      'JOVEM significa Jorge Vergara Museo. No es un museo de trofeos de futbol: combina arte contemporáneo, tecnología, instalaciones inmersivas y la memoria creativa de Jorge Vergara. Está dentro del Estadio Akron y su programa puede incluir talleres, cine y experiencias sensoriales.',
    color: 'orange',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=JOVEM+Jorge+Vergara+Museo+Estadio+Akron',
    websiteUrl: 'https://jovem.org/',
  },
  {
    number: '10',
    type: 'museo',
    name: 'MUPAG',
    area: 'CENTRO',
    address: 'Paseo Fray Antonio Alcalde 225 · Centro',
    hours: 'Mar–sáb · 10:00–17:30',
    cue: 'PERIODISMO / IMPRENTA / ARTES GRÁFICAS',
    description:
      'El Museo del Periodismo y las Artes Gráficas ocupa la Casa de los Perros, donde funcionó la primera imprenta de la Nueva Galicia. Sus salas cuentan la historia de la prensa, la impresión, la fotografía y la gráfica; también recibe exposiciones temporales y actividades editoriales.',
    color: 'green',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Museo+del+Periodismo+y+las+Artes+Gr%C3%A1ficas+Guadalajara',
    websiteUrl: 'https://tequiero.guadalajara.gob.mx/lugares/museo-del-periodismo-y-las-artes-graficas-la-casa-de-los-perros',
  },
];

const OPTION_COUNT = String(MUSEUMS.length).padStart(2, '0');

export function MuseumRoutePage() {
  const mainRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Museos de Guadalajara: opciones según lo que quieres ver · Bruuk';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const updateProgress = () => {
      const isMobile = window.matchMedia('(max-width: 820px)').matches;
      const scrollableDistance = isMobile
        ? main.scrollHeight - main.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = isMobile ? main.scrollTop : window.scrollY;
      const progress = scrollableDistance > 0 ? currentScroll / scrollableDistance : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    updateProgress();
    main.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      main.removeEventListener('scroll', updateProgress);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div className="museum-route-page">
      <header className="museum-route-nav">
        <BruukLogo width={96} />
        <div className="museum-route-nav-title">
          <span>/ MUSEOS GDL</span>
          <strong>ELIGE UNO</strong>
        </div>
        <a href="#opciones" aria-label={`Ir a las ${MUSEUMS.length} opciones de museos`}>
          {OPTION_COUNT} OPCIONES <ArrowDown size={16} />
        </a>
      </header>

      <aside className="museum-route-progress" aria-label="Progreso de opciones">
        <span>PROGRESO</span>
        <div
          className="museum-route-progress-track"
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

      <main ref={mainRef}>
        <section className="museum-route-hero" aria-labelledby="museum-route-title">
          <div className="museum-route-hero-copy">
            <span className="museum-route-kicker">GUADALAJARA · MUSEOS PARA ELEGIR</span>
            <h1 id="museum-route-title">
              ¿QUIERES IR A <em>UN MUSEO?</em>
            </h1>
            <p>
              No tienes que recorrerlos todos ni seguir un orden. Elige según lo que hoy
              quieras ver: murales, arte contemporáneo, historia, fósiles o una experiencia inmersiva.
            </p>
            <div className="museum-route-facts" aria-label="Datos de la selección">
              <span><b>{OPTION_COUNT}</b> OPCIONES</span>
              <span><b>01</b> PLAN</span>
              <span><b>TÚ</b> ELIGES</span>
            </div>
            <a className="museum-route-primary" href="#opcion-01">
              VER OPCIONES <ArrowDownRight size={19} />
            </a>
          </div>

          <div className="museum-route-poster" aria-label="Selección visual de museos">
            <div className="museum-route-poster-top">
              <span>MUSEUM PICKER</span>
              <span>BRUUK / 2026</span>
            </div>
            <strong>{OPTION_COUNT}</strong>
            <PanelsTopLeft size={72} strokeWidth={1.5} aria-hidden="true" />
            <div className="museum-route-poster-bottom">
              <span>ARTE · HISTORIA · CIENCIA</span>
              <span>GDL + ZAPOPAN</span>
            </div>
          </div>
        </section>

        <section className="museum-route-index" id="opciones" aria-labelledby="museum-route-index-title">
          <div>
            <span>/ NO ES UNA RUTA</span>
            <h2 id="museum-route-index-title">¿QUÉ QUIERES<br />VER HOY?</h2>
          </div>
          <p>
            Cada ficha te dice qué exhibe realmente el lugar para que escojas con intención.
            Los programas temporales cambian, así que conviene confirmar horario y exposición
            en el sitio del museo antes de salir.
          </p>
        </section>

        <div className="museum-route-stops">
          {MUSEUMS.map((museum, index) => (
            <article className={`museum-route-stop is-${museum.color}`} id={`opcion-${museum.number}`} key={museum.number}>
              <div className="museum-route-stop-visual">
                <div className="museum-route-stop-visual-top">
                  <span>OPCIÓN {museum.number} / {OPTION_COUNT}</span>
                  <span>{museum.area}</span>
                </div>
                <strong>{museum.number}</strong>
                <Landmark aria-hidden="true" />
                <span className="museum-route-stop-cue">{museum.cue}</span>
              </div>

              <div className="museum-route-stop-copy">
                <div className="museum-route-stop-meta">
                  <span>{museum.type === 'museo' ? '/ MUSEO' : museum.type === 'galeria' ? '/ ESPACIO DE ARTE' : '/ SEGUNDA SEDE DEL MAZ'}</span>
                  <span>{museum.number} — {OPTION_COUNT}</span>
                </div>
                <h2 className={museum.name.length > 18 ? 'is-long-title' : undefined}>{museum.name}</h2>
                <p>{museum.description}</p>
                <dl>
                  <div><dt><MapPin size={16} /> UBICACIÓN</dt><dd>{museum.address}</dd></div>
                  <div><dt><Clock3 size={16} /> HORARIO BASE</dt><dd>{museum.hours}</dd></div>
                </dl>
                <div className="museum-route-actions">
                  <a href={museum.mapUrl} target="_blank" rel="noreferrer">
                    VER EN MAPA <ArrowUpRight size={18} />
                  </a>
                  {museum.websiteUrl && (
                    <a className="is-secondary" href={museum.websiteUrl} target="_blank" rel="noreferrer">
                      SITIO OFICIAL <ArrowUpRight size={18} />
                    </a>
                  )}
                </div>
                {index < MUSEUMS.length - 1 && <span className="museum-route-next">OTRA OPCIÓN ↓</span>}
              </div>
            </article>
          ))}
        </div>

        <section className="museum-route-outro" aria-labelledby="museum-route-outro-title">
          <span>/ SIGUE EXPLORANDO</span>
          <h2 id="museum-route-outro-title">ELIGE UNO.<br />VE SIN PRISA.</h2>
          <p>No se trata de tachar una lista. Escoge el museo que se parezca al plan que quieres hoy y date tiempo para recorrerlo.</p>
          <a href="/guadalajara/spots">VER MÁS LUGARES <ArrowUpRight size={19} /></a>
        </section>
      </main>
    </div>
  );
}
