import { createCanvas2DRenderer } from "./canvas2d";
import { parseCssColor } from "./color";
import {
  DEFAULTS,
  type ResolvedOptions,
  type WaterCausticsHandle,
  type WaterCausticsOptions,
} from "./types";
import { createWebGLRenderer, type OverlayRenderer } from "./webgl";

function resolveOptions(input: WaterCausticsOptions = {}): ResolvedOptions {
  const reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    intensity: input.intensity ?? DEFAULTS.intensity,
    speed: input.speed ?? (reduceMotion ? 0 : DEFAULTS.speed),
    scale: input.scale ?? DEFAULTS.scale,
    color: input.color ?? DEFAULTS.color,
    tint: input.tint ?? DEFAULTS.tint,
    tintStrength: input.tintStrength ?? DEFAULTS.tintStrength,
    blendMode: input.blendMode ?? DEFAULTS.blendMode,
    maxDpr: input.maxDpr ?? DEFAULTS.maxDpr,
  };
}

function styleCanvas(canvas: HTMLCanvasElement, blendMode: string) {
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
    mixBlendMode: blendMode,
  });
}

function makeCanvas(blendMode: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  styleCanvas(canvas, blendMode);
  return canvas;
}

/**
 * Mount an animated water-caustic overlay on `target`.
 *
 * The target keeps whatever background you already have — image, video,
 * or DOM. This only appends a transparent canvas on top (WebGL when
 * available, Canvas 2D otherwise).
 */
export function mountWaterCaustics(
  target: HTMLElement,
  options: WaterCausticsOptions = {},
): WaterCausticsHandle {
  if (!target) {
    throw new Error("mountWaterCaustics requires a target element.");
  }

  let opts = resolveOptions(options);
  const previousPosition = target.style.position;
  let didSetPosition = false;
  if (getComputedStyle(target).position === "static") {
    target.style.position = "relative";
    didSetPosition = true;
  }

  const glCanvas = makeCanvas(opts.blendMode);
  let renderer: OverlayRenderer | null = createWebGLRenderer(glCanvas);
  let canvas = glCanvas;

  if (!renderer) {
    const fallback = makeCanvas(opts.blendMode);
    renderer = createCanvas2DRenderer(fallback);
    canvas = fallback;
  }

  if (!renderer) {
    canvas.dataset.waterCaustics = "unsupported";
    canvas.dataset.waterCausticsError = "No canvas renderer available.";
    console.warn("water-caustics: No canvas renderer available.");
    target.appendChild(canvas);
    return {
      canvas,
      get paused() {
        return true;
      },
      pause() {},
      resume() {},
      setOptions() {},
      resize() {},
      destroy() {
        canvas.remove();
        if (didSetPosition) target.style.position = previousPosition;
      },
    };
  }

  canvas.dataset.waterCaustics = renderer.kind;
  target.appendChild(canvas);

  let color = parseCssColor(opts.color);
  let tint = parseCssColor(opts.tint);
  let raf = 0;
  let clockOffset = 0;
  let lastNow = performance.now();
  let paused = opts.speed === 0;
  let destroyed = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);
    const cssW = Math.max(1, target.clientWidth);
    const cssH = Math.max(1, target.clientHeight);
    renderer.resize(
      Math.max(1, Math.round(cssW * dpr)),
      Math.max(1, Math.round(cssH * dpr)),
    );
  };

  const draw = (now: number) => {
    if (destroyed) return;
    if (!paused) {
      clockOffset += (now - lastNow) * 0.001 * opts.speed;
    }
    lastNow = now;
    resize();
    renderer.frame(clockOffset, opts, color, tint);
  };

  const loop = (now: number) => {
    draw(now);
    if (!paused && !destroyed) {
      raf = requestAnimationFrame(loop);
    }
  };

  const play = () => {
    if (destroyed || paused) return;
    cancelAnimationFrame(raf);
    lastNow = performance.now();
    raf = requestAnimationFrame(loop);
  };

  resize();
  draw(lastNow);
  if (!paused) {
    raf = requestAnimationFrame(loop);
  }

  const observer = new ResizeObserver(() => {
    if (paused) draw(performance.now());
  });
  observer.observe(target);

  const onLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(raf);
  };
  const onRestored = () => {
    if (!destroyed) play();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const handle: WaterCausticsHandle = {
    canvas,
    get paused() {
      return paused;
    },
    pause() {
      if (destroyed || paused) return;
      paused = true;
      cancelAnimationFrame(raf);
    },
    resume() {
      if (destroyed || !paused) return;
      paused = false;
      play();
    },
    setOptions(next: WaterCausticsOptions) {
      if (destroyed) return;
      const speedTouched = next.speed !== undefined;
      opts = { ...opts, ...next };
      if (next.color) color = parseCssColor(opts.color);
      if (next.tint) tint = parseCssColor(opts.tint);
      if (next.blendMode) canvas.style.mixBlendMode = opts.blendMode;
      if (opts.speed === 0) {
        handle.pause();
        draw(performance.now());
      } else if (speedTouched && paused) {
        handle.resume();
      } else if (paused) {
        draw(performance.now());
      }
    },
    resize() {
      if (!destroyed) draw(performance.now());
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      renderer.dispose();
      canvas.remove();
      if (didSetPosition) target.style.position = previousPosition;
    },
  };

  return handle;
}
