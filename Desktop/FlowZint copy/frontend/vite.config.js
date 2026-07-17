import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/claims':         'http://localhost:8000',
      '/refunds':        'http://localhost:8000',
      '/api/analytics':  'http://localhost:8000',
      '/api/delivery':   'http://localhost:8000',
    },
  },
})
