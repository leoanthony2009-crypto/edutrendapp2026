import type { Page } from '@playwright/test'

export type Role = 'student' | 'teacher' | 'leader'

/** Seed a signed-in session before first navigation (pre-backend local auth). */
export async function seedRole(page: Page, role: Role | null): Promise<void> {
  await page.addInitScript(
    ([r]) => {
      localStorage.setItem('bloom:v1:splashSeen', 'true')
      if (r) localStorage.setItem('bloom:v1:account', JSON.stringify({ role: r, name: 'E2E' }))
    },
    [role]
  )
}
