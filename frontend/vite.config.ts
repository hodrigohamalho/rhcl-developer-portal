import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `npm run dev`, /api is proxied to the local Quarkus backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/q": "http://localhost:8080",
    },
  },
});
