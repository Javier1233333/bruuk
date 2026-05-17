import { useEffect, useRef } from 'react';

export function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width  = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animId: number;
    let t = 0;

    function draw() {
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      t += 0.006;

      ctx.clearRect(0, 0, w, h);

      /* Single smooth wave line */
      const waveY = h * 0.5;
      const amp = h * 0.08;

      ctx.beginPath();
      ctx.moveTo(0, waveY + Math.sin(t) * amp);
      for (let x = 0; x <= w; x += 8) {
        const y = waveY + Math.sin(x * 0.002 + t) * amp;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(80, 180, 240, 0.4)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
