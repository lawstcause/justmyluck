import { useEffect, useRef } from 'react';
import { isLateNight, lamp as shared } from './lampState';

// One desk lamp for the whole site: a warm pool of light that drifts toward the
// pointer, shadowed corners, dust floating in the beam, and a little film grain.

type Mote = { x: number; y: number; r: number; vx: number; vy: number; phase: number };

const BASE = { x: 0.46, y: 0.38 };

export function Lamp() {
  const lightRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const light = lightRef.current;
    const canvas = dustRef.current;
    if (!light || !canvas) return;
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = window.matchMedia('(hover: none)').matches;

    let w = 0;
    let h = 0;
    const lamp = { x: BASE.x, y: BASE.y };
    const aim = { x: BASE.x, y: BASE.y };
    const motes: Mote[] = [];
    let casters: HTMLElement[] = [];
    let frame = 0;

    document.documentElement.classList.toggle('late-night', isLateNight());

    // Every element marked data-shadow casts its shadow away from the lamp.
    function castShadows() {
      if (frame % 30 === 0) casters = Array.from(document.querySelectorAll<HTMLElement>('[data-shadow]'));
      const lx = lamp.x * w;
      const ly = lamp.y * h;
      for (const el of casters) {
        const box = el.getBoundingClientRect();
        if (!box.width) continue;
        const dx = box.left + box.width / 2 - lx;
        const dy = box.top + box.height / 2 - ly;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = shared.dark ? 2 : 5 + Math.min(24, dist * 0.04);
        el.style.setProperty('--sx', `${((dx / dist) * reach).toFixed(1)}px`);
        el.style.setProperty('--sy', `${((dy / dist) * reach + 6).toFixed(1)}px`);
      }
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
      const count = Math.round(Math.min(70, (w * h) / 22000));
      motes.length = 0;
      for (let i = 0; i < count; i += 1) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.5 + Math.random() * 1.4,
          vx: (Math.random() - 0.5) * 0.12,
          vy: -0.04 - Math.random() * 0.12,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return;
      // The lamp leans toward the pointer but never leaves the desk's centre entirely.
      aim.x = BASE.x + (event.clientX / w - BASE.x) * 0.55;
      aim.y = BASE.y + (event.clientY / h - BASE.y) * 0.55;
    }

    function paintLight() {
      light!.style.setProperty('--lx', `${(lamp.x * 100).toFixed(2)}%`);
      light!.style.setProperty('--ly', `${(lamp.y * 100).toFixed(2)}%`);
    }

    let raf = 0;
    function tick(now: number) {
      const t = now / 1000;
      if (touch) {
        aim.x = BASE.x + Math.sin(t * 0.13) * 0.06;
        aim.y = BASE.y + Math.cos(t * 0.11) * 0.04;
      }
      lamp.x += (aim.x - lamp.x) * 0.05;
      lamp.y += (aim.y - lamp.y) * 0.05;
      shared.x = lamp.x;
      shared.y = lamp.y;
      paintLight();
      castShadows();
      frame += 1;

      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        const lx = lamp.x * w;
        const ly = lamp.y * h;
        const reach = Math.max(w, h) * 0.42;
        for (const m of motes) {
          m.x += m.vx + Math.sin(t * 0.6 + m.phase) * 0.08;
          m.y += m.vy;
          if (m.y < -4) m.y = h + 4;
          if (m.x < -4) m.x = w + 4;
          if (m.x > w + 4) m.x = -4;
          const d = Math.hypot(m.x - lx, m.y - ly) / reach;
          if (d >= 1) continue;
          const twinkle = 0.65 + Math.sin(t * 1.7 + m.phase * 3) * 0.35;
          ctx.globalAlpha = (1 - d) * (1 - d) * (shared.dark ? 0.12 : 0.55) * twinkle;
          ctx.fillStyle = '#ffe2b0';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!document.hidden) raf = window.requestAnimationFrame(tick);
    }

    function onVisible() {
      window.cancelAnimationFrame(raf);
      if (!document.hidden && !still) raf = window.requestAnimationFrame(tick);
    }

    resize();
    paintLight();
    castShadows();
    window.addEventListener('resize', resize);
    if (!still) {
      window.addEventListener('pointermove', onMove);
      document.addEventListener('visibilitychange', onVisible);
      raf = window.requestAnimationFrame(tick);
    }
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="lamp" ref={lightRef} />
      <div aria-hidden="true" className="grain-film" />
      <canvas aria-hidden="true" className="dust" ref={dustRef} />
    </>
  );
}
