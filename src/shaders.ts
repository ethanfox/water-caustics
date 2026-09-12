export const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Overhead-sun caustics as one continuous sheet.
 * Each octave is rotated by an irrational angle, domain-warped, then
 * sampled along incommensurate directions — never axis-aligned sin(x)*sin(y),
 * so no tile grid. Keep in lockstep with caustic-field.ts.
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

vec2 rotate(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float octave(vec2 uv, float t, float fi) {
  vec2 p = rotate(uv, 0.41 + fi * 2.39996323);
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 w = vec2(
      sin(p.y * (1.17 + fi * 0.19 + fk * 0.13) + p.x * (0.23 + fi * 0.07) + t * (0.31 + fi * 0.05) + fi * 1.61 + fk),
      cos(p.x * (0.89 + fi * 0.17 + fk * 0.11) - p.y * (0.29 + fi * 0.09) - t * (0.27 + fi * 0.04) + fi * 1.13)
    );
    p += w * (0.46 / (1.0 + fi * 0.16 + fk * 0.11));
  }
  vec2 d1 = vec2(1.00 + fi * 0.21, 0.33 + fi * 0.13);
  vec2 d2 = vec2(-0.51 - fi * 0.11, 1.09 + fi * 0.08);
  float ridge = sin(dot(p, d1) + t * 0.09) * sin(dot(p, d2) - t * 0.07);
  return 0.165 / (abs(ridge) * 5.6 + 0.22);
}

float field(vec2 uv, float t) {
  vec2 p = uv + vec2(
    sin(uv.y * 0.37 + t * 0.19) * 0.42,
    cos(uv.x * 0.31 - t * 0.15) * 0.42
  );
  float a = octave(p, t, 0.0);
  vec2 p2 = rotate(p * 1.61803399 + vec2(1.83, -1.27), 1.17809725);
  float b = octave(p2, t * 0.79, 1.0);
  vec2 p3 = rotate(p * 2.61803399 + vec2(2.54, -0.74), 1.54809725);
  float c = octave(p3, t * 0.62, 2.0);
  float acc = max(a * 1.12, b * 0.78) + c * 0.34;
  return pow(clamp(acc, 0.0, 1.95), 1.45);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 res = u_resolution;
  vec2 uv = (frag * 2.0 - res) / max(res.y, 1.0);
  uv *= 1.72 * u_scale;

  float t = u_time * 0.36;
  float c = field(uv, t);
  float veins = smoothstep(0.15, 1.08, c);
  float haze = smoothstep(0.03, 0.78, c) * 0.3;
  float glow = (veins * 0.9 + haze) * u_intensity;
  vec3 rgb = mix(u_tint, u_color, clamp(glow, 0.0, 1.0));
  float alpha = clamp(u_tint_strength + glow * (0.88 - u_tint_strength * 0.35), 0.0, 1.0);

  gl_FragColor = vec4(rgb, alpha);
}
`;
