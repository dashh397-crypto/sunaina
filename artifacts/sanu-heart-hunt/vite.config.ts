import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel/Vite will normally use "/"
const basePath = process.env.BASE_PATH || '/';

// Used only for local development.
// Vercel does not need this value during the production build.
const port = Number(process.env.PORT || 5173);

export default defineConfig({
  root: __dirname,

  base: basePath,

  plugins: [
    react(),
    tailwindcss(),

    // Only useful during development.
    // It does not affect the production Vercel build.
    runtimeErrorOverlay(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),

      '@assets': path.resolve(
        __dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },

    dedupe: ['react', 'react-dom'],
  },

  build: {
    // Vercel will serve this directory.
    outDir: path.resolve(__dirname, 'dist/public'),

    // Clean the old build before generating a new one.
    emptyOutDir: true,
  },

  server: {
    host: '0.0.0.0',
    port,
    strictPort: false,

    fs: {
      strict: true,
    },
  },

  preview: {
    host: '0.0.0.0',
    port,
  },
});
