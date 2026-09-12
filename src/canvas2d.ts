import { sampleCaustic } from "./caustic-field";
import type { ResolvedOptions } from "./types";
import type { OverlayRenderer } from "./webgl";

const MAX_COMPUTE = 150;

export type Canvas2DRenderer = OverlayRenderer & { kind: "canvas2d" };

export function createCanvas2DRenderer(
  canvas: HTMLCanvasElement,
): Canvas2DRenderer | null {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;

  const buffer = document.createElement("canvas");
  const bctx = buffer.getContext("2d", { willReadFrequently: true });
  if (!bctx) return null;

  let pixels = new Uint8ClampedArray(4);
  let image: ImageData | null = null;
  let lastDraw = -1e9;

  const resize = (width: number, height: number) => {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const frame = (
    time: number,
    opts: ResolvedOptions,
    color: [number, number, number],
    tint: [number, number, number],
  ) => {
    const outW = Math.max(1, canvas.width);
    const outH = Math.max(1, canvas.height);
    const bw = Math.max(1, Math.min(MAX_COMPUTE, outW));
    const bh = Math.max(1, Math.round((bw * outH) / outW));
    if (buffer.width !== bw || buffer.height !== bh) {
      buffer.width = bw;
      buffer.height = bh;
      pixels = new Uint8ClampedArray(bw * bh * 4);
      image = new ImageData(pixels, bw, bh);
      lastDraw = -1e9;
    }

    const now = performance.now();
    if (lastDraw >= 0 && now - lastDraw < 50) {
      return;
    }
    lastDraw = now;

    if (!image) {
      image = new ImageData(pixels, bw, bh);
    }

    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const [r, g, b, a] = sampleCaustic(
          x + 0.5,
          bh - y - 0.5,
          bw,
          bh,
          time,
          opts.scale,
          opts.intensity,
          color,
          tint,
          opts.tintStrength,
        );
        const i = (y * bw + x) * 4;
        pixels[i] = r * 255;
        pixels[i + 1] = g * 255;
        pixels[i + 2] = b * 255;
        pixels[i + 3] = a * 255;
      }
    }

    bctx.putImageData(image, 0, 0);
    ctx.clearRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buffer, 0, 0, outW, outH);
  };

  return { kind: "canvas2d", resize, frame, dispose() {} };
}
