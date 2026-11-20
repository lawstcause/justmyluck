let ctx: AudioContext | null = null;
let scratchGain: GainNode | null = null;
let scratchFilter: BiquadFilterNode | null = null;
let scratchSrc: AudioBufferSourceNode | null = null;
let noiseCache: AudioBuffer | null = null;
const samples = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();
let flapVoice: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
let coinTossSrc: AudioBufferSourceNode | null = null;

function sampleUrl(file: string) {
  return `${import.meta.env.BASE_URL}sfx/${file}`;
}

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

function loadSample(file: string): Promise<AudioBuffer | null> {
  const c = ac();
  if (!c) return Promise.resolve(null);
  const hit = samples.get(file);
  if (hit) return Promise.resolve(hit);
  const pending = loading.get(file);
  if (pending) return pending;
  const job = fetch(sampleUrl(file))
    .then((res) => {
      if (!res.ok) throw new Error(file);
      return res.arrayBuffer();
    })
    .then((raw) => c.decodeAudioData(raw.slice(0)))
    .then((buf) => {
      samples.set(file, buf);
      loading.delete(file);
      return buf;
    })
    .catch(() => {
      loading.delete(file);
      return null;
    });
  loading.set(file, job);
  return job;
}

function playSample(buf: AudioBuffer, volume = 1) {
  const c = ac();
  if (!c) return null;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(c.destination);
  src.start();
  return { src, gain };
}

export function unlockSound() {
  ac();
  void loadSample('coin-flip.mp3');
  void loadSample('flap-board.mp3');
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

export function playCoinToss(_strength: number, _duration: number) {
  const ready = samples.get('coin-flip.mp3');
  if (ready) {
    try {
      coinTossSrc?.stop();
    } catch {
      /* already stopped */
    }
    const voice = playSample(ready, 1);
    coinTossSrc = voice?.src ?? null;
    if (coinTossSrc) coinTossSrc.onended = () => {
      if (coinTossSrc === voice?.src) coinTossSrc = null;
    };
    return;
  }
  void loadSample('coin-flip.mp3').then((buf) => {
    if (!buf) return;
    try {
      coinTossSrc?.stop();
    } catch {
      /* already stopped */
    }
    const voice = playSample(buf, 1);
    coinTossSrc = voice?.src ?? null;
  });
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

export function startFlap() {
  const c = ac();
  if (!c) return;
  if (flapVoice) return;

  function run(buf: AudioBuffer) {
    const current = ac();
    if (!current || flapVoice) return;
    const src = current.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = current.createGain();
    gain.gain.value = 0.85;
    src.connect(gain);
    gain.connect(current.destination);
    src.start();
    flapVoice = { src, gain };
  }

  const ready = samples.get('flap-board.mp3');
  if (ready) {
    run(ready);
    return;
  }
  void loadSample('flap-board.mp3').then((buf) => {
    if (buf) run(buf);
  });
}

export function stopFlap() {
  const voice = flapVoice;
  flapVoice = null;
  if (!voice || !ctx) return;
  const t = ctx.currentTime;
  try {
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), t);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  } catch {
    /* ignore */
  }
  window.setTimeout(() => {
    try {
      voice.src.stop();
    } catch {
      /* already stopped */
    }
  }, 140);
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

function noiseHit(c: AudioContext, t: number, opts: { type: BiquadFilterType; freq: number; q?: number; peak: number; decay: number }) {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = opts.type;
  f.frequency.value = opts.freq;
  f.Q.value = opts.q ?? 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + opts.decay + 0.02);
}

/** Pull-chain lamp switch: a snappy two-part click. */
export function playSwitch(on: boolean) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  noiseHit(c, t, { type: 'bandpass', freq: on ? 2600 : 2100, q: 2, peak: 0.12, decay: 0.03 });
  burst(c, t, { freq: on ? 1400 : 1100, type: 'square', peak: 0.025, decay: 0.025 });
  noiseHit(c, t + 0.05, { type: 'bandpass', freq: 900, q: 1.2, peak: 0.05, decay: 0.04 });
  if (on) burst(c, t + 0.08, { freq: 120, type: 'sine', peak: 0.015, decay: 0.5 });
}

/** A coin left spinning on its edge: a long, slowing metallic ring. */
export function playEdgeRing() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 14; i += 1) {
    const at = t + Math.pow(i / 14, 1.6) * 1.6;
    burst(c, at, { freq: 3100 - i * 40, type: 'sine', peak: 0.03 * (1 - i / 16), decay: 0.12 });
    noiseHit(c, at, { type: 'highpass', freq: 3000, peak: 0.02 * (1 - i / 16), decay: 0.03 });
  }
  burst(c, t + 0.02, { freq: 2240, type: 'triangle', peak: 0.05, attack: 0.01, decay: 2.4 });
}

/** Two dice skittering across wood. */
export function playDice() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const hits = [0, 0.07, 0.12, 0.2, 0.26, 0.35, 0.41, 0.52, 0.6];
  hits.forEach((dt, i) => {
    const fade = 1 - i / hits.length;
    noiseHit(c, t + dt, { type: 'bandpass', freq: 1500 + (i % 3) * 500, q: 3, peak: 0.12 * fade, decay: 0.035 });
    burst(c, t + dt, { freq: 640 + (i % 2) * 180, type: 'triangle', peak: 0.04 * fade, decay: 0.05 });
  });
}

/** A fortune cookie snapping in half. */
export function playCrack() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  noiseHit(c, t, { type: 'highpass', freq: 1800, peak: 0.18, decay: 0.05 });
  noiseHit(c, t + 0.03, { type: 'bandpass', freq: 900, q: 1.5, peak: 0.1, decay: 0.08 });
  noiseHit(c, t + 0.09, { type: 'highpass', freq: 3200, peak: 0.05, decay: 0.04 });
}

/** A soft magical shimmer for the clover. */
export function playShimmer() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  [1318, 1568, 1976, 2637].forEach((f, i) => {
    burst(c, t + i * 0.06, { freq: f, type: 'sine', peak: 0.03, attack: 0.01, decay: 0.6 });
  });
}

/** Something new lands on the desk. */
export function playDrop() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, { freq: 110, type: 'sine', peak: 0.12, decay: 0.2 });
  noiseHit(c, t, { type: 'lowpass', freq: 700, peak: 0.08, decay: 0.12 });
}
