import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, calls to /api are forwarded to the Express server on port 5000
export default defineConfig({
  plugins: [react()],
  // Always use a single copy of React, even for libraries like react-leaflet / react-router
  resolve: { dedupe: ['react', 'react-dom'] },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
