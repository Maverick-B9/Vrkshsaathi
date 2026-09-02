import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Proxy is not needed — Firebase SDK connects to emulators directly
  },
  build: {
    // Code-split by route for better mobile performance
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/firebase")) return "firebase";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) return "react";
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/@headlessui") || id.includes("node_modules/lucide-react")) return "ui";
        },
      },
    },
  },
});
