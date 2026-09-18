import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5175,
    strictPort: true,
    proxy: {
      "/backend": {
        target: process.env.ZOOMO_API_URL || "http://127.0.0.1:3000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/backend/, ""),
      },
      "/static": {
        target: process.env.ZOOMO_API_URL || "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
