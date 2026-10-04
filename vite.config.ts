import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // One React for the app, R3F and Tegaki's adapter.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['tegaki', 'tegaki/fonts/caveat', 'tegaki/fonts/parisienne'],
  },
})
