import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "WaterCaustics",
      formats: ["es", "iife"],
      fileName: (format) =>
        format === "es" ? "water-caustics.js" : "water-caustics.iife.js",
    },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
});
