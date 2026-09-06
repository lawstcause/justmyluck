import type { ReportPayload } from './types';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodePayload(payload: ReportPayload): string {
  const json = JSON.stringify(payload);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodePayload(raw: string): ReportPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(raw));
    const parsed = JSON.parse(json) as ReportPayload;
    if (!parsed || typeof parsed.c !== 'string' || typeof parsed.t !== 'number' || !parsed.a) {
      return null;
    }
    return {
      c: parsed.c,
      a: parsed.a,
      s: typeof parsed.s === 'string' ? parsed.s : '',
      t: parsed.t,
      w: typeof parsed.w === 'string' ? parsed.w : undefined,
    };
  } catch {
    return null;
  }
}

export function reportHash(payload: string): string {
  return `#/r/${payload}`;
}
