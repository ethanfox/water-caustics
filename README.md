# water-caustics

Animated overhead-sun **water caustics** as a transparent canvas overlay (WebGL, with a Canvas 2D fallback). Other sites keep their own background — sand, a photo, a video, a page — and this package only draws the shimmering lines of light.

The included demo sits the shader on a SpongeBob title-card seafloor still (sandy floor, scattered dark rocks). That still is **demo-only** and is not published with the npm package.

## Install

```bash
npm install water-caustics
```

From this repo, until it is on the registry:

```bash
npm install /path/to/water-caustics
```

## Use

The target element should already show your background. The overlay fills it.

```html
<div id="scene" style="position: relative; width: 100%; height: 100vh">
  <img src="seafloor.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover" />
</div>

<script type="module">
  import { mountWaterCaustics } from "water-caustics";

  const water = mountWaterCaustics(document.getElementById("scene"), {
    intensity: 1,
    speed: 1,
    scale: 1,
  });

  // water.pause()
  // water.resume()
  // water.setOptions({ intensity: 0.6 })
  // water.destroy()
</script>
```

Script-tag / IIFE build:

```html
<script src="./dist/water-caustics.iife.js"></script>
<script>
  WaterCaustics.mountWaterCaustics(document.getElementById("scene"));
</script>
```

If the host is `position: static`, the mount call sets `position: relative` for the overlay and restores it on `destroy()`.

`prefers-reduced-motion: reduce` freezes the pattern (`speed: 0`) unless you pass an explicit `speed`.

WebGL is used when the browser can compile the shader. Otherwise the same pattern runs on Canvas 2D (slightly softer, same API). The canvas sets `data-water-caustics` to `webgl`, `canvas2d`, or `unsupported`.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `intensity` | `1` | Brightness of the caustic veins |
| `speed` | `1` | Animation rate. `0` is still |
| `scale` | `1` | How large the light network is |
| `color` | `#f4fff8` | Highlight color (any CSS color) |
| `tint` | `#2f7d88` | Water wash |
| `tintStrength` | `0.12` | Wash opacity `0`–`1` |
| `blendMode` | `normal` | CSS `mix-blend-mode` on the canvas |
| `maxDpr` | `2` | Device-pixel-ratio cap |

## Demo

```bash
npm install
npm run dev
```

Then open the printed local URL (port **43173**).

```bash
npm run build        # library → dist/
npm run build:demo   # static demo → dist-demo/
```

## License

MIT. The demo seafloor still is a third-party title-card frame used only as a visual target in this repo.
