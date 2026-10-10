import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    headers: { "Cross-Origin-Opener-Policy": "same-origin" },
  },
  preview: { host: "0.0.0.0", port: 4173, allowedHosts: true },
  resolve: {
    alias: { "@": path.resolve(dir, "src") },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 2000,
  },
});
