export const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Overhead-sun caustics: domain-warped sine zeros become bright veins,
 * then a second finer layer adds shimmer. Tint is a low-alpha wash so
 * whatever sits behind the canvas stays the seafloor.
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

float causticLayer(vec2 uv, float t) {
  float acc = 0.0;
  vec2 p = uv;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    p = uv + vec2(
      sin(p.y * 2.05 + t + fi * 1.7),
      cos(p.x * 1.95 - t * 0.82 + fi * 1.3)
    ) * 0.36;
    float s = sin(p.x) * sin(p.y);
    acc += 0.11 / (abs(s) * 6.4 + 0.3);
  }
  return pow(clamp(acc, 0.0, 1.7), 1.85);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 res = u_resolution;
  vec2 uv = (frag * 2.0 - res) / max(res.y, 1.0);
  uv *= 2.35 * u_scale;

  float t = u_time * 0.42 * u_speed;

  float large = causticLayer(uv, t);
  float fine = causticLayer(uv * 1.55 + vec2(3.7, -2.1), t * 0.73 + 4.2);
  float c = large * 0.78 + fine * 0.38;
  float veins = smoothstep(0.16, 1.05, c);
  float haze = smoothstep(0.04, 0.82, c) * 0.32;
  float glow = (veins * 0.88 + haze) * u_intensity;
  vec3 highlight = u_color;
  vec3 wash = u_tint;
  vec3 rgb = mix(wash, highlight, clamp(glow, 0.0, 1.0));
  float alpha = clamp(u_tint_strength + glow * (0.88 - u_tint_strength * 0.35), 0.0, 1.0);

  gl_FragColor = vec4(rgb, alpha);
}
`;
