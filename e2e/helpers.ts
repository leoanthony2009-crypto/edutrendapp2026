import type { Page } from '@playwright/test'

/**
 * Real login via the API — the response cookie lands in the browser context,
 * exactly as production auth works. No client-side role state exists to seed.
 */
export async function login(page: Page, schoolCode: string, userCode: string): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('bloom:v1:splashSeen', 'true'))
  const res = await page.request.post('/api/auth/login', {
    headers: { 'x-bloom-client': '1' },
    data: { schoolCode, userCode, passcode: `petal-${userCode}` },
  })
  if (!res.ok()) throw new Error(`login failed for ${schoolCode}/${userCode}: ${res.status()}`)
}

export async function skipSplashOnly(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('bloom:v1:splashSeen', 'true'))
}
