import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    sourcemap: true,
    // Ensure CSS is properly handled
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.css']
  }
})
