import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Send API calls to the local FastAPI server, so the browser sees one address (same-site cookie).
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
