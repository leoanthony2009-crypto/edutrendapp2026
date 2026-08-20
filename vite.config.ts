/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_PROXY = {
  '/api': {
    target: `http://127.0.0.1:${process.env.BLOOM_API_PORT ?? 8787}`,
    changeOrigin: false,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: API_PROXY },
  preview: { proxy: API_PROXY },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    // Frontend tests boot the real API server in-process. Those server
    // modules are plain Node ESM and must be loaded natively rather than
    // bundled — Vite cannot bundle the node:sqlite builtin they depend on.
    server: {
      deps: {
        external: [/\/server\/.*\.mjs$/],
      },
    },
  },
})
