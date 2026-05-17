# Product & Technical Specification: Bruuk "Interactive Ocean" Landing Page

## 1. Visión del Proyecto
Transformar la landing page convencional de Bruuk en una experiencia interactiva inmersiva. En lugar de un diseño tradicional con texto y formularios, el usuario se encuentra con un **"mar de desconocimiento"** a pantalla completa. Al interactuar (hacer clic o tap), el usuario "pesca" o descubre spots reales (comenzando con nuestra lista seleccionada de cafeterías), tangibilizando la filosofía de Bruuk: *explorar, descubrir y romper la rutina.*

---

## 2. Propuesta de Valor y Objetivos de Producto
*   **Curiosidad sin fricción:** Reducir la barrera de entrada a cero. No hay registro obligatorio inicial; la interacción es inmediata.
*   **Gamificación del Descubrimiento:** Replicar la experiencia core de la app (salir a buscar lo inesperado) a través de una mecánica web simple y adictiva.
*   **Viralidad Orgánica:** Crear un producto interactivo y visualmente disruptivo que incentive a los usuarios a compartir el enlace ("entra aquí, pícale al mar y mira lo que sale").
*   **Captura de Leads Cualificados:** Implementar un disparador de conversión basado en el engagement. Tras **3 a 5 clics** (descubrimientos), se presenta un prompt o modal suave para capturar el email del usuario.
*   **Posicionamiento de Marca:** Diferenciar a Bruuk de directorios comunes (estilo Yelp o Google Maps), posicionándola como una marca cercana al arte, el diseño y la experiencia urbana auténtica.

---

## 3. Experiencia de Usuario (UX) e Interacción

### A. Estado Inicial (Landing)
*   **Visual:** Video en loop de un mar texturizado o plano cenital que abarca el 100% de la pantalla (`viewport`). Debe ser responsivo y cubrir todo el fondo sin dejar franjas negras.
*   **Identidad:** Logo de **Bruuk** en formato SVG, color blanco puro, fijado en el centro de la parte inferior de la pantalla.
*   **Atmósfera:** Sonido de fondo en loop (olas de mar/ambiente calmo). *Nota: Se incluirá un botón discreto de Mute en la esquina superior derecha para cumplir con las políticas de autoplay de los navegadores.*

### B. Mecánica de Clic (El Descubrimiento)
1.  El usuario hace clic o tap en cualquier punto del mar.
2.  **Efecto Ripple / Onda:** Se genera una animación concéntrica (burbuja o波纹) utilizando `framer-motion` desde las coordenadas exactas `(x, y)` del clic.
3.  **Aparición del Spot:** Emerge una tarjeta flotante (`Card`) estilizada con la información de una cafetería de la lista de forma aleatoria (o basada en el cuadrante).
    *   *Contenido de la Card:* Foto del lugar, nombre, una frase corta descriptiva (ej. *"Aquí se lee bien solo"*), y un mini-mapa o enlace directo a la ubicación.
4.  **Persistencia:** El punto donde se hizo clic queda marcado permanentemente en el mar con un pequeño indicador luminoso (faro o pin sutil), permitiendo al usuario ver el "mapa de descubrimientos" que va construyendo de forma acumulativa.
5.  **Diseño Sonoro Alternativo (Opcional):** El audio del mar puede sufrir ligeras variaciones de ecualización o volumen dependiendo de la zona del clic (ej. sonidos más profundos en el centro, olas más agresivas en los bordes).

---

## 4. Arquitectura Técnica (Stack Tecnológico)
El desarrollo se realizará sobre el stack actual del proyecto para garantizar una integración rápida y ligera:

*   **Framework:** React + Vite (para un setup rápido y rendimiento óptimo).
*   **Estilos:** Tailwind CSS (diseño responsivo y utilitario).
*   **Animaciones:** `framer-motion` (para la transición de emergencia de las tarjetas y el efecto de las ondas/burbujas en el clic).
*   **Estructura de Datos:** Un archivo estático `spots.json` local con la lista de cafeterías curadas.

### Estructura del JSON de Datos (`spots.json`):
```json
[
  {
    "id": "spot_001",
    "name": "Nombre de la Cafetería",
    "description": "Una frase corta que defina la vibra del lugar.",
    "imageUrl": "/assets/images/spots/cafe1.jpg",
    "coordinates": { "lat": 20.6736, "lng": -103.344 },
    "mapsLink": "[https://google.com/maps/](https://google.com/maps/)..."
  }
]