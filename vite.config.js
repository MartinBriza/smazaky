import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app can be served from a subpath (for example /smazaky/), so we use a
// relative base to avoid broken asset URLs when the site is not mounted at the
// server root. This keeps the map and list app working reliably in both local
// dev and GitHub Pages deployments.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
});
