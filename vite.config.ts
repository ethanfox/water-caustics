import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "demo",
  publicDir: "public",
  resolve: {
    alias: {
      "water-caustics": resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  server: {
    host: true,
    port: 43173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 43173,
    strictPort: true,
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist-demo"),
    emptyOutDir: true,
  },
});
