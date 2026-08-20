import { useEffect, useRef } from 'react';

const TWO_PI = Math.PI * 2;
const RADAR_CHARS = ['S', '/', 'R', '+', 'A', 'D', 'A', 'R'];

function angleDistance(first: number, second: number) {
  return Math.abs(Math.atan2(Math.sin(first - second), Math.cos(first - second)));
}

export function AsciiRadarBackground({ paused = false }: { paused?: boolean }) {
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
      const pixelRatio = Math.min(window.devicePixelRatio || 1, bounds.width < 640 ? 1 : 1.25);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      const seconds = time * 0.001;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const sweepAngle = reducedMotion.matches ? -0.65 : (seconds * 0.48) % TWO_PI - Math.PI;
      const xGap = width < 640 ? 108 : 132;
      const yGap = width < 640 ? 58 : 66;

      context.clearRect(0, 0, width, height);
      context.font = `900 ${width < 640 ? 15 : 17}px "DM Mono", "Courier New", monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      for (let row = 0, y = yGap / 2; y < height; row += 1, y += yGap) {
        for (let column = 0, x = xGap / 2; x < width; column += 1, x += xGap) {
          const offsetX = x - centerX;
          const offsetY = y - centerY;
          const pointAngle = Math.atan2(offsetY, offsetX);
          const distanceFromSweep = angleDistance(pointAngle, sweepAngle);
          const echo = Math.max(0, 1 - distanceFromSweep / 0.72);
          const fixedNoise = ((column * 19 + row * 31) % 17) / 17;
          const base = 0.045 + fixedNoise * 0.045;
          const opacity = Math.min(0.62, base + echo * (0.24 + fixedNoise * 0.24));
          const characterIndex = (column * 3 + row * 5) % RADAR_CHARS.length;

          context.fillStyle = `rgba(139, 124, 246, ${opacity})`;
          context.shadowColor = echo > 0.65 ? '#8b7cf6' : 'transparent';
          context.shadowBlur = echo > 0.65 ? 9 : 0;
          context.fillText(RADAR_CHARS[characterIndex], x, y);
        }
      }

      context.shadowBlur = 0;
    };

    const animate = (time: number) => {
      if (!document.hidden && time - lastFrame >= 84) {
        draw(time);
        lastFrame = time;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      resize();
      if (reducedMotion.matches || paused) draw(0);
      else animationFrame = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(start);
    resizeObserver.observe(canvas);
    reducedMotion.addEventListener('change', start);
    document.addEventListener('visibilitychange', start);
    start();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      reducedMotion.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', start);
    };
  }, [paused]);

  return <canvas ref={canvasRef} className="radar-ascii-background" aria-hidden="true" />;
}
