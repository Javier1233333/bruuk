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

    /* ── Caustic shimmer spots ── */
    const caustics = Array.from({ length: 7 }, (_, i) => ({
      ox: Math.random(),
      oy: Math.random(),
      sx: 0.12 + Math.random() * 0.1,
      sy: 0.08 + Math.random() * 0.08,
      phase: i * 1.1,
      r: 70 + Math.random() * 80,
    }));

    function draw() {
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      t += 0.007;

      /* Base ocean gradient — aerial deep-sea */
      const base = ctx.createLinearGradient(0, 0, w * 0.6, h);
      base.addColorStop(0,   '#010f22');
      base.addColorStop(0.3, '#012a48');
      base.addColorStop(0.7, '#014a7a');
      base.addColorStop(1,   '#01365a');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      /* ── Wave bands — horizontal sine layers ── */
      const BANDS = 18;
      for (let b = 0; b < BANDS; b++) {
        const progress  = b / BANDS;
        const baseY     = progress * h;
        const speed     = 0.25 + progress * 0.55;
        const amp       = 6  + progress * 14;
        const freq      = 0.004 + progress * 0.006;
        const freq2     = freq * 1.63;
        const alpha     = 0.03 + progress * 0.045;

        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= w; x += 3) {
          const y = baseY
            + Math.sin(x * freq  + t * speed) * amp
            + Math.sin(x * freq2 + t * speed * 0.7 + 1.4) * (amp * 0.38);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(80, 180, 240, ${alpha})`;
        ctx.lineWidth   = 1.2;
        ctx.stroke();
      }

      /* ── Diagonal shimmer streaks — light reflection ── */
      ctx.save();
      const STREAKS = 8;
      for (let s = 0; s < STREAKS; s++) {
        const cycle = (t * 18 + s * (w / STREAKS)) % (w + 300) - 150;
        const grad  = ctx.createLinearGradient(cycle, 0, cycle + 60, h);
        grad.addColorStop(0,   'rgba(160, 220, 255, 0)');
        grad.addColorStop(0.5, `rgba(160, 220, 255, ${0.04 + Math.sin(t + s) * 0.015})`);
        grad.addColorStop(1,   'rgba(160, 220, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cycle - 40, 0);
        ctx.lineTo(cycle + 80, 0);
        ctx.lineTo(cycle + 80 + h * 0.3, h);
        ctx.lineTo(cycle - 40 + h * 0.3, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      /* ── Caustic light patches ── */
      for (const c of caustics) {
        const cx = (c.ox + Math.sin(t * c.sx + c.phase) * 0.18) * w;
        const cy = (c.oy + Math.cos(t * c.sy + c.phase * 0.7) * 0.12) * h;
        const r  = c.r * (0.85 + Math.sin(t * 0.9 + c.phase) * 0.15);
        const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0,   'rgba(100, 200, 255, 0.10)');
        g.addColorStop(0.5, 'rgba(60,  160, 220, 0.05)');
        g.addColorStop(1,   'rgba(0,   120, 190, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── Deep center glow ── */
      const cg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.55);
      cg.addColorStop(0, `rgba(0, 80, 160, ${0.18 + Math.sin(t * 0.4) * 0.06})`);
      cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cg;
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
