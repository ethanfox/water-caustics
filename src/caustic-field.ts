/** JS port of the fragment shader so the Canvas 2D fallback matches WebGL. */

function causticLayer(uvx: number, uvy: number, t: number): number {
  let acc = 0;
  let px = uvx;
  let py = uvy;
  for (let i = 0; i < 3; i++) {
    const nx = uvx + Math.sin(py * 2.05 + t + i * 1.7) * 0.36;
    const ny = uvy + Math.cos(px * 1.95 - t * 0.82 + i * 1.3) * 0.36;
    px = nx;
    py = ny;
    const s = Math.sin(px) * Math.sin(py);
    acc += 0.11 / (Math.abs(s) * 6.4 + 0.3);
  }
  const clamped = Math.min(Math.max(acc, 0), 1.7);
  return clamped ** 1.85;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function sampleCaustic(
  fragX: number,
  fragY: number,
  resX: number,
  resY: number,
  time: number,
  scale: number,
  intensity: number,
  color: [number, number, number],
  tint: [number, number, number],
  tintStrength: number,
): [number, number, number, number] {
  const denom = Math.max(resY, 1);
  let uvx = ((fragX * 2 - resX) / denom) * 2.35 * scale;
  let uvy = ((fragY * 2 - resY) / denom) * 2.35 * scale;
  const t = time * 0.42;
  const large = causticLayer(uvx, uvy, t);
  const fine = causticLayer(uvx * 1.55 + 3.7, uvy * 1.55 - 2.1, t * 0.73 + 4.2);
  const c = large * 0.78 + fine * 0.38;
  const veins = smoothstep(0.16, 1.05, c);
  const haze = smoothstep(0.04, 0.82, c) * 0.32;
  const glow = (veins * 0.88 + haze) * intensity;
  const mix = Math.min(Math.max(glow, 0), 1);
  const r = tint[0] + (color[0] - tint[0]) * mix;
  const g = tint[1] + (color[1] - tint[1]) * mix;
  const b = tint[2] + (color[2] - tint[2]) * mix;
  const alpha = Math.min(
    Math.max(tintStrength + glow * (0.88 - tintStrength * 0.35), 0),
    1,
  );
  return [r, g, b, alpha];
}
