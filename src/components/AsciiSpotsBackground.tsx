import { useEffect, useRef } from 'react';

const ASCII_CHARS = ['B', 'R', 'U', 'U', 'K'];

export function AsciiSpotsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);

      const cellSize = width < 640 ? 18 : 21;
      const seconds = time * 0.001;
      context.font = `700 ${Math.round(cellSize * 0.68)}px "DM Mono", "Courier New", monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      for (let row = 0, y = cellSize / 2; y < height; row += 1, y += cellSize) {
        for (let column = 0, x = cellSize / 2; x < width; column += 1, x += cellSize) {
          const wave =
            Math.sin(column * 0.42 + seconds * 0.75) +
            Math.cos(row * 0.34 - seconds * 0.58) +
            Math.sin((column + row) * 0.2 + seconds * 0.32);
          const signal = (wave + 3) / 6;

          if (signal < 0.43) continue;

          const characterIndex = Math.min(
            ASCII_CHARS.length - 1,
            Math.floor(((signal - 0.43) / 0.57) * ASCII_CHARS.length),
          );
          const isBright = signal > 0.67 || (column + row) % 11 === 0;
          const opacity = 0.08 + signal * (isBright ? 0.35 : 0.2);

          context.fillStyle = `rgba(139, 124, 246, ${opacity})`;
          context.fillText(ASCII_CHARS[characterIndex], x, y);
        }
      }

    };

    const animate = (time: number) => {
      if (time - lastFrame >= 45) {
        draw(time);
        lastFrame = time;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      resize();
      if (reducedMotion.matches) {
        draw(0);
      } else {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const resizeObserver = new ResizeObserver(start);
    resizeObserver.observe(canvas);
    reducedMotion.addEventListener('change', start);
    start();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      reducedMotion.removeEventListener('change', start);
    };
  }, []);

  return <canvas ref={canvasRef} className="spots-ascii-background" aria-hidden="true" />;
}
