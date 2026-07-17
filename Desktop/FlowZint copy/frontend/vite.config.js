import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Forward all backend routes to FastAPI on port 8000
      '/claims':   { target: 'http://localhost:8000', changeOrigin: true },
      '/refunds':  { target: 'http://localhost:8000', changeOrigin: true },
      '/api':      { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
