import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const LIVE_API = "https://zoomo-production.up.railway.app";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true,
    proxy: {
      "/backend": {
        target: LIVE_API,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/backend/, ""),
      },
    },
  },
});
