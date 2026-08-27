import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 🟢 ALLOWS THE MANUS APP MOBILE PREVIEW EMBED ENGINE TO STREAM VITE INTERFACES
    allowedHosts: true
  }
});
