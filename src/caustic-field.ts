/** JS port of the fragment shader so the Canvas 2D fallback matches WebGL. */

function rotate(x: number, y: number, a: number): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c * x - s * y, s * x + c * y];
}

function octave(uvx: number, uvy: number, t: number, fi: number): number {
  let [px, py] = rotate(uvx, uvy, 0.41 + fi * 2.39996323);
  for (let k = 0; k < 2; k++) {
    const fk = k;
    const wx =
      Math.sin(
        py * (1.17 + fi * 0.19 + fk * 0.13) +
          px * (0.23 + fi * 0.07) +
          t * (0.31 + fi * 0.05) +
          fi * 1.61 +
          fk,
      );
    const wy =
      Math.cos(
        px * (0.89 + fi * 0.17 + fk * 0.11) -
          py * (0.29 + fi * 0.09) -
          t * (0.27 + fi * 0.04) +
          fi * 1.13,
      );
    const amp = 0.46 / (1 + fi * 0.16 + fk * 0.11);
    px += wx * amp;
    py += wy * amp;
  }
  const d1x = 1.0 + fi * 0.21;
  const d1y = 0.33 + fi * 0.13;
  const d2x = -0.51 - fi * 0.11;
  const d2y = 1.09 + fi * 0.08;
  const ridge =
    Math.sin(px * d1x + py * d1y + t * 0.09) *
    Math.sin(px * d2x + py * d2y - t * 0.07);
  return 0.165 / (Math.abs(ridge) * 5.6 + 0.22);
}

function field(uvx: number, uvy: number, t: number): number {
  const px = uvx + Math.sin(uvy * 0.37 + t * 0.19) * 0.42;
  const py = uvy + Math.cos(uvx * 0.31 - t * 0.15) * 0.42;
  const a = octave(px, py, t, 0);
  const p2 = rotate(px * 1.61803399 + 1.83, py * 1.61803399 - 1.27, 1.17809725);
  const b = octave(p2[0], p2[1], t * 0.79, 1);
  const p3 = rotate(px * 2.61803399 + 2.54, py * 2.61803399 - 0.74, 1.54809725);
  const c = octave(p3[0], p3[1], t * 0.62, 2);
  const acc = Math.max(a * 1.12, b * 0.78) + c * 0.34;
  const clamped = Math.min(Math.max(acc, 0), 1.95);
  return clamped ** 1.45;
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
  const uvx = ((fragX * 2 - resX) / denom) * 1.72 * scale;
  const uvy = ((fragY * 2 - resY) / denom) * 1.72 * scale;
  const c = field(uvx, uvy, time * 0.36);
  const veins = smoothstep(0.15, 1.08, c);
  const haze = smoothstep(0.03, 0.78, c) * 0.3;
  const glow = (veins * 0.9 + haze) * intensity;
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
