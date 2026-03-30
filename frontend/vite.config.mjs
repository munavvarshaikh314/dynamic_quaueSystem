import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ⭐ move vite cache to another folder (prevents Windows lock)
  cacheDir: "node_modules/.vite_cache",

  optimizeDeps: {
    force: true, // rebuild deps instead of deleting locked ones
  },

  server: {
    port: 5174,
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
