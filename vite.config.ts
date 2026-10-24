import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // GitHub Pages project sites live under /<repo>/. Relative asset URLs work
  // there (and on Vercel/Netlify) without hard-coding the repository name.
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: {
    // Bind to IPv4 loopback explicitly. On Windows, `localhost` can resolve to
    // IPv6 first; some browsers (notably Edge in some environments) then fail.
    host: '127.0.0.1',
    port: 5173,
    watch: {
      // Keep the dev server stable when editors write atomic temp files.
      ignored: ['**/.tmp/**', '**/*.tmpdir/**', '**/*.tsbuildinfo'],
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
}));
