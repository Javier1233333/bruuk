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
      t += 0.004;

      /* Base ocean gradient */
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0,   '#010f22');
      base.addColorStop(0.4, '#012a48');
      base.addColorStop(1,   '#01365a');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      /* Single wide wave */
      const waveY = h * 0.45;
      const amp = h * 0.12;

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = waveY
          + Math.sin(x * 0.003 + t) * amp
          + Math.sin(x * 0.006 + t * 1.4) * (amp * 0.3);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, waveY - amp, 0, h);
      waveGrad.addColorStop(0, 'rgba(2, 60, 120, 0.6)');
      waveGrad.addColorStop(1, 'rgba(1, 20, 50, 0.8)');
      ctx.fillStyle = waveGrad;
      ctx.fill();

      /* Subtle glow */
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.5);
      glow.addColorStop(0, `rgba(30, 100, 180, ${0.12 + Math.sin(t * 0.5) * 0.04})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

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
