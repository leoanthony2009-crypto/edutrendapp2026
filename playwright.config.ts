import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

/** Pre-provisioned Chromium (CI/sandbox) or Playwright's own download. */
const SYSTEM_CHROMIUM = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'
const executablePath = existsSync(SYSTEM_CHROMIUM) ? SYSTEM_CHROMIUM : undefined

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: [
    {
      command: 'node server/index.mjs',
      url: 'http://127.0.0.1:8787/api/health',
      reuseExistingServer: false,
      env: { BLOOM_DB: ':memory:', BLOOM_SEED: '1', BLOOM_TEST: '1', PORT: '8787', NODE_ENV: 'test' },
    },
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
    },
  ],
})
