import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    proxy: {
      '/nesting-api': {
        target: 'https://api-nesting.nestingcenter.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nesting-api/, '/nesting'),
      }
    }
  }
})
