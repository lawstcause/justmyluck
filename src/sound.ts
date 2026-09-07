let ctx: AudioContext | null = null;
let scratchGain: GainNode | null = null;
let scratchFilter: BiquadFilterNode | null = null;
let scratchSrc: AudioBufferSourceNode | null = null;
let noiseCache: AudioBuffer | null = null;

function Ctor() {
  return window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function ac(): AudioContext | null {
  const Audio = Ctor();
  if (!Audio) return null;
  if (!ctx) ctx = new Audio();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noise(c: AudioContext, seconds = 1) {
  if (noiseCache && noiseCache.sampleRate === c.sampleRate) return noiseCache;
  const length = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, length, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = last * 0.93 + white * 0.07;
    data[i] = last * 0.7 + white * 0.3;
  }
  noiseCache = buf;
  return buf;
}

function burst(
  c: AudioContext,
  t: number,
  opts: { freq: number; type?: OscillatorType; peak: number; attack?: number; decay: number },
) {
  const osc = c.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.peak, t + (opts.attack ?? 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + opts.decay + 0.02);
}

export function unlockSound() {
  ac();
}

export function playTap() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, { freq: 170, type: 'triangle', peak: 0.05, decay: 0.09 });
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 420;
  f.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.05, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.09);
}

export function playCoinToss(strength: number, duration: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const d = Math.max(0.45, duration);
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500 + strength * 900, t);
  lp.frequency.exponentialRampToValueAtTime(160, t + d);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.1 + strength * 0.07, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(lp);
  lp.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + d);

  const ring = c.createOscillator();
  ring.type = 'triangle';
  ring.frequency.setValueAtTime(1680 + strength * 400, t);
  ring.frequency.exponentialRampToValueAtTime(380, t + d);
  const rg = c.createGain();
  rg.gain.setValueAtTime(0.0001, t);
  rg.gain.exponentialRampToValueAtTime(0.045, t + 0.04);
  rg.gain.exponentialRampToValueAtTime(0.0001, t + d);
  ring.connect(rg);
  rg.connect(c.destination);
  ring.start(t);
  ring.stop(t + d + 0.02);
}

export function playCoinLand(strength: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, { freq: 92, type: 'sine', peak: 0.16 + strength * 0.08, decay: 0.16 });
  burst(c, t + 0.012, { freq: 1860, type: 'triangle', peak: 0.07, decay: 0.22 });
  burst(c, t + 0.028, { freq: 2740, type: 'sine', peak: 0.04, decay: 0.14 });
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const g = c.createGain();
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(hp);
  hp.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.1);
}

export function startScratch() {
  const c = ac();
  if (!c) return;
  if (scratchSrc && scratchGain) return;
  stopScratch(true);
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2100;
  filter.Q.value = 0.9;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 700;
  const g = c.createGain();
  g.gain.value = 0.0001;
  src.connect(hp);
  hp.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
  scratchSrc = src;
  scratchFilter = filter;
  scratchGain = g;
}

export function moveScratch(speed: number) {
  if (!scratchGain || !scratchFilter || !ctx) return;
  const t = ctx.currentTime;
  const amt = Math.min(1, speed / 18);
  const peak = 0.0001 + amt * 0.09;
  scratchGain.gain.cancelScheduledValues(t);
  scratchGain.gain.setTargetAtTime(peak, t, 0.03);
  scratchFilter.frequency.setTargetAtTime(1400 + amt * 2200, t, 0.04);
}

export function stopScratch(immediate = false) {
  if (!ctx) return;
  const t = ctx.currentTime;
  if (scratchGain) {
    scratchGain.gain.cancelScheduledValues(t);
    if (immediate) scratchGain.gain.setValueAtTime(0.0001, t);
    else scratchGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  }
  const src = scratchSrc;
  scratchSrc = null;
  scratchGain = null;
  scratchFilter = null;
  if (src) {
    window.setTimeout(
      () => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      },
      immediate ? 0 : 120,
    );
  }
}

export function playPenWrite() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 3200;
  f.Q.value = 1.4;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.18);
}

export function playPenTravel() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(2400, t + 0.7);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.035, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.82);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.85);
}

export function playPenCircle() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(1800, t);
  f.frequency.linearRampToValueAtTime(2800, t + 0.28);
  f.frequency.linearRampToValueAtTime(1600, t + 0.55);
  f.Q.value = 1.1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.055, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.6);
}

export function playFlap(intensity: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1200 + Math.random() * 1100;
  f.Q.value = 2.2;
  const g = c.createGain();
  const peak = 0.045 * Math.min(1.4, intensity);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.05);
  burst(c, t, { freq: 240 + Math.random() * 80, type: 'square', peak: peak * 0.35, decay: 0.03 });
}

export function playPaper() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.24);
}
