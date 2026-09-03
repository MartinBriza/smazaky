import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for a small React app served locally during development.
// We expose the server on 0.0.0.0 so it is reachable from the local network,
// and set the default port to 5173 for consistency.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
