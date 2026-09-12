/** Canvas port of the shader's domain-warped ridged fBm light ribbons. */

const latticeCache = new Map<number, number>();

function fract(value: number): number {
  return value - Math.floor(value);
}

function latticeKey(x: number, y: number, z: number): number {
  return x * 16777216 + y * 4096 + z;
}

function latticeNoise(x: number, y: number, z: number): number {
  const key = latticeKey(x, y, z);
  const cached = latticeCache.get(key);
  if (cached !== undefined) return cached;
  if (latticeCache.size > 24000) latticeCache.clear();
  const value = fract(
    Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123,
  );
  latticeCache.set(key, value);
  return value;
}

function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = fract(x);
  const fy = fract(y);
  const fz = fract(z);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const low = mix(
    mix(latticeNoise(ix, iy, iz), latticeNoise(ix + 1, iy, iz), ux),
    mix(
      latticeNoise(ix, iy + 1, iz),
      latticeNoise(ix + 1, iy + 1, iz),
      ux,
    ),
    uy,
  );
  const high = mix(
    mix(
      latticeNoise(ix, iy, iz + 1),
      latticeNoise(ix + 1, iy, iz + 1),
      ux,
    ),
    mix(
      latticeNoise(ix, iy + 1, iz + 1),
      latticeNoise(ix + 1, iy + 1, iz + 1),
      ux,
    ),
    uy,
  );
  return mix(low, high, uz);
}

function turn(x: number, y: number): [number, number] {
  return [x * 0.8 + y * 0.6, -x * 0.6 + y * 0.8];
}

function fbm(x: number, y: number, z: number): number {
  let sum = 0;
  let amplitude = 0.54;
  for (let octave = 0; octave < 4; octave++) {
    sum += noise3(x, y, z) * amplitude;
    const rotated = turn(x, y);
    x = rotated[0] * 2.03 + 1.7;
    y = rotated[1] * 2.03 - 2.4;
    z = z * 1.71 + 0.37;
    amplitude *= 0.47;
  }
  return sum / 1.017;
}

function ridgedFbm(x: number, y: number, z: number): number {
  let sum = 0;
  let amplitude = 0.52;
  let normalizer = 0;
  for (let octave = 0; octave < 5; octave++) {
    const ridge = 1 - Math.abs(noise3(x, y, z) * 2 - 1);
    sum += ridge * ridge * amplitude;
    normalizer += amplitude;
    const rotated = turn(x, y);
    x = rotated[0] * 1.94 - 1.3;
    y = rotated[1] * 1.94 + 2.1;
    z = z * 1.67 + 0.29;
    amplitude *= 0.48;
  }
  return sum / normalizer;
}

function field(uvx: number, uvy: number, t: number): number {
  const turnedUv = turn(uvx, uvy);
  const broadWarpX =
    fbm(uvx * 0.46 + 3.1, uvy * 0.46 - 1.7, t * 0.065) - 0.5;
  const broadWarpY =
    fbm(
      turnedUv[0] * 0.41 - 5.8,
      turnedUv[1] * 0.41 + 4.2,
      t * 0.058 + 9.4,
    ) - 0.5;
  const fineWarpX =
    fbm(
      uvx * 0.82 + broadWarpX * 1.8,
      uvy * 0.82 + broadWarpY * 1.8,
      t * 0.091 + 17,
    ) - 0.5;
  const fineWarpY =
    fbm(
      turnedUv[0] * 0.76 - broadWarpX * 1.6,
      turnedUv[1] * 0.76 - broadWarpY * 1.6,
      t * 0.083 + 31,
    ) - 0.5;

  const px = uvx + broadWarpX * 1.16 + fineWarpX * 0.34;
  const py = uvy + broadWarpY * 1.16 + fineWarpY * 0.34;
  const turnedP = turn(px, py);
  const first = ridgedFbm(px * 1.72, py * 1.72, t * 0.1 + 2);
  const second = ridgedFbm(
    turnedP[0] * 2.31 + 8.3,
    turnedP[1] * 2.31 - 6.7,
    t * 0.078 + 23,
  );

  const firstBody = smoothstep(0.43, 0.69, first);
  const firstGlow = smoothstep(0.31, 0.6, first);
  const crossing = smoothstep(0.49, 0.72, second);
  const crossingGlow = smoothstep(0.36, 0.63, second);
  const variation =
    0.76 + fbm(px * 0.58 + 12, py * 0.58 + 12, t * 0.052 + 41) * 0.3;
  const ribbons = Math.max(firstBody, crossing * 0.68);
  const glow = Math.max(firstGlow * 0.58, crossingGlow * 0.34);
  return Math.min(Math.max((ribbons * 0.72 + glow * 0.28) * variation, 0), 1);
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
  const uvx = ((fragX * 2 - resX) / denom) * scale;
  const uvy = ((fragY * 2 - resY) / denom) * scale;
  const c = field(uvx, uvy, time * 0.32);
  const glow = c * intensity;
  const highlight = smoothstep(0.05, 1.05, glow);
  const r = tint[0] + (color[0] - tint[0]) * highlight;
  const g = tint[1] + (color[1] - tint[1]) * highlight;
  const b = tint[2] + (color[2] - tint[2]) * highlight;
  const alpha = Math.min(
    Math.max(tintStrength + glow * (0.34 - tintStrength * 0.1), 0),
    0.48,
  );
  return [r, g, b, alpha];
}
