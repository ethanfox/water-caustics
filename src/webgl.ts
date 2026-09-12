import { createFullscreenTriangle, createProgram, getGl } from "./gl";
import { FRAG_SRC, VERT_SRC } from "./shaders";
import type { ResolvedOptions } from "./types";

export type OverlayRenderer = {
  kind: "webgl" | "canvas2d";
  resize: (width: number, height: number) => void;
  frame: (
    time: number,
    opts: ResolvedOptions,
    color: [number, number, number],
    tint: [number, number, number],
  ) => void;
  dispose: () => void;
};

export type WebGLRenderer = OverlayRenderer & { kind: "webgl" };

export function createWebGLRenderer(
  canvas: HTMLCanvasElement,
): WebGLRenderer | null {
  const gl = getGl(canvas);
  if (!gl) return null;

  let program: WebGLProgram;
  let buffer: WebGLBuffer;
  try {
    program = createProgram(gl, VERT_SRC, FRAG_SRC);
    gl.useProgram(program);
    buffer = createFullscreenTriangle(gl, program);
  } catch {
    return null;
  }

  const uTime = gl.getUniformLocation(program, "u_time");
  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uIntensity = gl.getUniformLocation(program, "u_intensity");
  const uScale = gl.getUniformLocation(program, "u_scale");
  const uColor = gl.getUniformLocation(program, "u_color");
  const uTint = gl.getUniformLocation(program, "u_tint");
  const uTintStrength = gl.getUniformLocation(program, "u_tint_strength");

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  return {
    kind: "webgl",
    resize(width, height) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    frame(time, opts, color, tint) {
      gl.uniform1f(uTime, time);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uIntensity, opts.intensity);
      gl.uniform1f(uScale, opts.scale);
      gl.uniform3f(uColor, color[0], color[1], color[2]);
      gl.uniform3f(uTint, tint[0], tint[1], tint[2]);
      gl.uniform1f(uTintStrength, opts.tintStrength);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
