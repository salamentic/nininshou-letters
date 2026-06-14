import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'vendor-three';
          if (id.includes('node_modules/react-tooltip') || id.includes('node_modules/react-toastify') || id.includes('node_modules/@floating-ui')) return 'vendor-ui';
          if (id.includes('node_modules/howler') || id.includes('node_modules/use-sound')) return 'vendor-sound';
          if (id.includes('node_modules/rough-notation') || id.includes('node_modules/vanilla-rough-notation')) return 'vendor-notation';
          if (id.includes('node_modules/tegaki')) return 'vendor-tegaki';
        },
      },
    },
  },
});
