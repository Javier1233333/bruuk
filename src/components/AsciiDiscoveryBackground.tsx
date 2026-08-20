import { useEffect, useRef } from 'react';

const LETTERS = ['B', 'R', 'U', 'U', 'K'];

export function AsciiDiscoveryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let lastPaint = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const paint = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const compact = width < 700;
      const stepX = compact ? 46 : 62;
      const stepY = compact ? 40 : 52;
      const seconds = reducedMotion ? 0 : time / 1000;

      context.clearRect(0, 0, width, height);
      context.font = `700 ${compact ? 10 : 12}px "DM Mono", monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      for (let row = 0; row < Math.ceil(height / stepY) + 1; row += 1) {
        for (let column = 0; column < Math.ceil(width / stepX) + 1; column += 1) {
          const wave = Math.sin(column * 0.71 + seconds * 0.8) + Math.cos(row * 0.57 - seconds * 0.55);
          if (wave < 0.3) continue;

          const drift = Math.sin(row * 0.42 + seconds * 0.7) * 7;
          const x = column * stepX + drift;
          const y = row * stepY + Math.cos(column * 0.38 + seconds * 0.45) * 5;
          const alpha = 0.045 + Math.min(0.13, (wave - 0.3) * 0.07);
          context.fillStyle = `rgba(139, 124, 246, ${alpha})`;
          context.fillText(LETTERS[(row * 3 + column) % LETTERS.length], x, y);
        }
      }
    };

    const animate = (time: number) => {
      if (time - lastPaint > 100) {
        paint(time);
        lastPaint = time;
      }
      frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(frame);
      resize();
      paint(0);
      if (!reducedMotion && !document.hidden) frame = window.requestAnimationFrame(animate);
    };

    const handleVisibility = () => start();
    window.addEventListener('resize', start);
    document.addEventListener('visibilitychange', handleVisibility);
    start();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', start);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="city-discovery-ascii" aria-hidden="true" />;
}
