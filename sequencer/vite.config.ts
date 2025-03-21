import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sequencer: resolve(__dirname, 'sequencer.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
})
