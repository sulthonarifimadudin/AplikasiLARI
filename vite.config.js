import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && basicSsl()
  ].filter(Boolean),
  base: './', // CRITICAL: Required for Capacitor to load assets from file://
}))
