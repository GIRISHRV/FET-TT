import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'FET-TT Timetable',
        short_name: 'FET-TT',
        description: 'A beautiful, offline-first timetable application.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Don't precache the data.json so it doesn't get stuck in the static app shell
        globIgnores: ['**/data.json'],
        runtimeCaching: [
          {
            // Always try to fetch the latest data.json from the network first.
            // If the user is offline, fall back to the last cached version.
            urlPattern: ({ url }) => url.pathname.includes('data.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'timetable-data-cache',
              networkTimeoutSeconds: 3, // Don't wait too long if on a spotty connection
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30 // Keep offline data for 30 days
              }
            }
          }
        ]
      }
    })
  ],
  base: './',
})
