import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/v2/',
  resolve: {
    alias: {
      '@tax-engine': path.resolve(__dirname, '../../src/utils/taxEngine.js'),
      '@repo-src': path.resolve(__dirname, '../../src'),
    },
  },
  server: {
    port: 5174,
    fs: { allow: [path.resolve(__dirname, '../..')] },
  },
})