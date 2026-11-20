// Flecks of gold foil that fly off the ticket under the quarter, tumble, and
// settle on the desk where they glint for a while before fading.

type Fleck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  floor: number;
  life: number;
  hue: number;
};

const MAX = 420;

export class GoldDust {
  private ctx: CanvasRenderingContext2D | null;
  private flecks: Fleck[] = [];
  private raf = 0;
  private running = false;
  private readonly still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  spray(x: number, y: number, dx: number, dy: number) {
    if (this.still) return;
    const speed = Math.hypot(dx, dy);
    const count = Math.min(5, Math.floor(speed / 5));
    for (let i = 0; i < count; i += 1) {
      if (this.flecks.length >= MAX) this.flecks.shift();
      this.flecks.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 12,
        vx: -dx * 0.06 + (Math.random() - 0.5) * 3,
        vy: -1.5 - Math.random() * 2.5,
        size: 1 + Math.random() * 2.2,
        spin: (Math.random() - 0.5) * 0.4,
        angle: Math.random() * Math.PI,
        floor: y + 20 + Math.random() * 70,
        life: 1,
        hue: 38 + Math.random() * 14,
      });
    }
    if (!this.running) {
      this.running = true;
      this.raf = window.requestAnimationFrame(this.frame);
    }
  }

  clear() {
    this.flecks = [];
  }

  private frame() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const t = performance.now() / 1000;
    for (const f of this.flecks) {
      if (f.y < f.floor) {
        f.vy += 0.22;
        f.vx *= 0.97;
        f.x += f.vx;
        f.y += f.vy;
        f.angle += f.spin;
      } else {
        // Settled on the desk: fade slowly, glint now and then.
        f.y = f.floor;
        f.life -= 0.0025;
      }
      const glint = 0.55 + Math.abs(Math.sin(t * 3 + f.angle * 5)) * 0.45;
      ctx.globalAlpha = Math.max(0, f.life) * glint;
      ctx.fillStyle = `hsl(${f.hue} 78% ${52 + glint * 20}%)`;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.fillRect(-f.size, -f.size * 0.6, f.size * 2, f.size * 1.2);
      ctx.restore();
    }
    this.flecks = this.flecks.filter((f) => f.life > 0);
    if (this.flecks.length) {
      this.raf = window.requestAnimationFrame(this.frame);
    } else {
      this.running = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
  }
}
