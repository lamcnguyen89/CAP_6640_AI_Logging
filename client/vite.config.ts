import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/vera-portal',
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',  // This makes the server accessible from outside the container
  },
})
