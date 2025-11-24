import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'frontend-service-production-fa7d.up.railway.app',
      '.railway.app',
      '.replit.dev'
    ],
    hmr: {
      clientPort: 443
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'frontend-service-production-fa7d.up.railway.app',
      '.railway.app',
      '.replit.dev'
    ]
  }
})
