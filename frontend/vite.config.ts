import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      '9a67260f-985a-4fac-82f4-4ebb87426b64-00-1mfx5kwt9os8u.picard.replit.dev'
    ]
  }
})
