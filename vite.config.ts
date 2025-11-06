import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  server: {
    proxy: {
      '/api':       { target: 'http://localhost:8080', changeOrigin: true },
      '/auth':      { target: 'http://localhost:8080', changeOrigin: true },
      '/org':       { target: 'http://localhost:8080', changeOrigin: true },
      '/inventory': { target: 'http://localhost:8080', changeOrigin: true },
      '/me':        { target: 'http://localhost:8080', changeOrigin: true },
    }
  }
})