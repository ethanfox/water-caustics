/** Parse a CSS color to linear-ish 0–1 RGB via a 2D canvas. */
export function parseCssColor(color: string): [number, number, number] {
  const canvas = parseCssColor.canvas ??= document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return [1, 1, 1];
  }
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return [data[0] / 255, data[1] / 255, data[2] / 255];
}

parseCssColor.canvas = undefined as HTMLCanvasElement | undefined;
