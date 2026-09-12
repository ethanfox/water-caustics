export const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Broad, softly thresholded ridged fBm ribbons. The noise evolves through
 * its third dimension so the network morphs in place instead of sliding.
 * Keep the visual structure in sync with caustic-field.ts.
 */
export const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform float u_scale;
uniform vec3 u_color;
uniform vec3 u_tint;
uniform float u_tint_strength;

float hash13(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  float low = mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y);
  float high = mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y);
  return mix(low, high, u.z);
}

vec2 turn(vec2 p) {
  return mat2(0.80, -0.60, 0.60, 0.80) * p;
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amplitude = 0.54;
  for (int octave = 0; octave < 4; octave++) {
    sum += noise3(p) * amplitude;
    p.xy = turn(p.xy) * 2.03 + vec2(1.7, -2.4);
    p.z = p.z * 1.71 + 0.37;
    amplitude *= 0.47;
  }
  return sum / 1.017;
}

float ridgedFbm(vec3 p) {
  float sum = 0.0;
  float amplitude = 0.52;
  float normalizer = 0.0;
  for (int octave = 0; octave < 5; octave++) {
    float ridge = 1.0 - abs(noise3(p) * 2.0 - 1.0);
    sum += ridge * ridge * amplitude;
    normalizer += amplitude;
    p.xy = turn(p.xy) * 1.94 + vec2(-1.3, 2.1);
    p.z = p.z * 1.67 + 0.29;
    amplitude *= 0.48;
  }
  return sum / normalizer;
}

float causticField(vec2 uv, float t) {
  vec2 broadWarp = vec2(
    fbm(vec3(uv * 0.46 + vec2(3.1, -1.7), t * 0.065)),
    fbm(vec3(turn(uv) * 0.41 + vec2(-5.8, 4.2), t * 0.058 + 9.4))
  ) - 0.5;
  vec2 fineWarp = vec2(
    fbm(vec3(uv * 0.82 + broadWarp * 1.8, t * 0.091 + 17.0)),
    fbm(vec3(turn(uv) * 0.76 - broadWarp * 1.6, t * 0.083 + 31.0))
  ) - 0.5;

  vec2 p = uv + broadWarp * 1.16 + fineWarp * 0.34;
  float first = ridgedFbm(vec3(p * 1.72, t * 0.10 + 2.0));
  float second = ridgedFbm(vec3(turn(p) * 2.31 + vec2(8.3, -6.7), t * 0.078 + 23.0));

  float firstBody = smoothstep(0.43, 0.69, first);
  float firstGlow = smoothstep(0.31, 0.60, first);
  float crossing = smoothstep(0.49, 0.72, second);
  float crossingGlow = smoothstep(0.36, 0.63, second);
  float variation = 0.76 + fbm(vec3(p * 0.58 + 12.0, t * 0.052 + 41.0)) * 0.30;

  float ribbons = max(firstBody, crossing * 0.68);
  float glow = max(firstGlow * 0.58, crossingGlow * 0.34);
  return clamp((ribbons * 0.72 + glow * 0.28) * variation, 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 res = u_resolution;
  vec2 uv = (frag * 2.0 - res) / max(res.y, 1.0);
  uv *= u_scale;

  float c = causticField(uv, u_time * 0.32);
  float glow = c * u_intensity;
  float highlight = smoothstep(0.05, 1.05, glow);
  vec3 rgb = mix(u_tint, u_color, highlight);
  float alpha = clamp(
    u_tint_strength + glow * (0.34 - u_tint_strength * 0.10),
    0.0,
    0.48
  );

  gl_FragColor = vec4(rgb, alpha);
}
`;
