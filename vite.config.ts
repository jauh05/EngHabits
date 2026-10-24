import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'EngHabits',
        short_name: 'EngHabits',
        description: 'Bangun kebiasaan Inggris, 2 jam setiap pagi, 90 hari.',
        theme_color: '#1F7A3A',
        background_color: '#9CD548',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // Saat pengembangan, /api diteruskan ke API akun di server/index.mjs.
  server: {
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
});
