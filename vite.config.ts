import path from 'path';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    mkcert(),
    // Service worker: precachea el shell de la app para que el POS cargue sin
    // internet. Los datos offline viven en IndexedDB, nunca en el SW: la API
    // siempre va a la red.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Nunca cachear la API: Dexie es la única fuente offline de datos.
            urlPattern: ({ url }) => url.pathname.includes('/api/'),
            handler: 'NetworkOnly'
          }
        ]
      },
      manifest: {
        name: 'DipleBill Seller',
        short_name: 'DipleBill POS',
        description: 'Punto de venta DipleBill',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        icons: [
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules')
    }
  }
});
