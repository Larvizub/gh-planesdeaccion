import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'Icon_tap_gh.png'],
      manifest: {
        name: 'Planes de Acción - Grupo Heroica',
        short_name: 'Planes Heroica',
        description: 'Gestión de planes de acción para recintos de Grupo Heroica',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'Icon_tap_gh.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Icon_tap_gh.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'Icon_tap_gh.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api-skill': {
        target: 'https://grupoheroicaapi.skillsuite.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-skill/, '/app/wssuite/api'),
        secure: false, // Por si hay problemas con certificados
      },
    },
  },
})
