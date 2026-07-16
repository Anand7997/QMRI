import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 8081,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      app: fileURLToPath(new URL("./src/app", import.meta.url)),
      layouts: fileURLToPath(new URL("./src/layouts", import.meta.url)),
      contexts: fileURLToPath(new URL("./src/contexts", import.meta.url)),
      features: fileURLToPath(new URL("./src/features", import.meta.url)),
      pages: fileURLToPath(new URL("./src/pages", import.meta.url)),
      shared: fileURLToPath(new URL("./src/shared", import.meta.url)),
      styles: fileURLToPath(new URL("./src/styles", import.meta.url)),
    },
  },
});