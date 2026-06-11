import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/index-[hash]-${Date.now()}.js`,
      }
    }
  },
  server: {
    proxy: {
      '/nesting-api': {
        target: 'https://api-nesting.nestingcenter.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/nesting-api/, '/nesting'),
        headers: {
          'Origin': 'https://webclient.nestingcenter.com',
          'Referer': 'https://webclient.nestingcenter.com/'
        }
      }
    }
  }
})
