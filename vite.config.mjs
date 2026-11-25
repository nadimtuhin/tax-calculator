import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // Vue CLI resolved extensionless .vue imports; src relies on that.
    extensions: ['.mjs', '.js', '.json', '.vue'],
  },
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // slabRoundingDrift sweeps 1.8M taxables; it runs near Jest's 5s default.
    testTimeout: 30000,
    hookTimeout: 30000,
    include: [
      'tests/unit/**/*.{spec,test}.js',
      'tests/integration/**/*.test.js',
      'tests/v2/**/*.test.js',
    ],
  },
})
