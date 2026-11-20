// Shared state for the room's single lamp. The Lamp component writes the light's
// position every frame; the 3D coin reads it so its shadow swings with the light.

export const lamp = { x: 0.46, y: 0.38, dark: false };

export const LIGHTS_EVENT = 'jml:lights';

function param(name: string) {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

/** Midnight to 5am local time, or forced with ?night=1 (and switched off with ?night=0). */
export function isLateNight() {
  const forced = param('night');
  if (forced === '1') return true;
  if (forced === '0') return false;
  const hour = new Date().getHours();
  return hour < 5;
}

export function setLightsOut(dark: boolean) {
  if (lamp.dark === dark) return;
  lamp.dark = dark;
  document.documentElement.classList.toggle('lights-out', dark);
  window.dispatchEvent(new CustomEvent(LIGHTS_EVENT, { detail: dark }));
}

/** Debug helper: ?tally=120 previews the desk as if that many picks were made. */
export function tallyOverride(): number | null {
  const raw = param('tally');
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/** Debug helper: ?edge=1 makes the next coin flip land on its edge. */
export function forceEdge() {
  return param('edge') === '1';
}
