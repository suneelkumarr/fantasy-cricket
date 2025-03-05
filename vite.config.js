import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '926c-2409-40d4-152-8b7a-207e-522d-d045-482d.ngrok-free.app',
      '36d9-223-229-215-174.ngrok-free.app'
    ]
  }
})
