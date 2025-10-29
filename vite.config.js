import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // permite conexiones externas
    port: 5173, // opcional, el puerto que quieras
    strictPort: false, // si el puerto está ocupado, Vite elegirá otro
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "overdramatically-removed-hadlee.ngrok-free.dev", // tu URL de ngrok
    ],
  },
});
