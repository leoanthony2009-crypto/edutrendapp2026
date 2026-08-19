/**
 * Real-browser WCAG 2.2 AA gate (audit P1-1/P2-12): axe-core WITH color
 * contrast, per role/route, plus keyboard-only interaction coverage the
 * jsdom gate cannot provide. This suite failing must fail the release.
 */
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { seedRole, type Role } from './helpers'

const MATRIX: Array<[Role, string]> = [
  ['student', '/today'],
  ['student', '/pulse'],
  ['student', '/trends'],
  ['student', '/hot'],
  ['student', '/profile'],
  ['teacher', '/today'],
  ['teacher', '/pulse'],
  ['teacher', '/manage'],
  ['teacher', '/builder'],
  ['teacher', '/trends'],
  ['leader', '/today'],
  ['leader', '/champion'],
  ['leader', '/builder'],
  ['leader', '/profile'],
]

for (const [role, route] of MATRIX) {
  test(`axe clean (incl. contrast): ${role} ${route}`, async ({ page }) => {
    await seedRole(page, role)
    await page.goto(route)
    await page.waitForTimeout(700)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })
}

test('axe clean: role sign-in', async ({ page }) => {
  await seedRole(page, null)
  await page.goto('/')
  await page.waitForTimeout(500)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
})

test('keyboard-only pulse completion with arrow-key radiogroup', async ({ page }) => {
  await seedRole(page, 'student')
  await page.goto('/pulse')
  await page.waitForTimeout(700)

  // Tab to the first radio
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    const role = await page.evaluate(() => document.activeElement?.getAttribute('role'))
    if (role === 'radio') break
  }
  await expect
    .poll(async () => page.evaluate(() => document.activeElement?.getAttribute('role')))
    .toBe('radio')

  // ArrowDown moves focus AND selection to the next option (audit P1-2)
  await page.keyboard.press('ArrowDown')
  const state = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[role="radio"]')]
    const active = document.activeElement as HTMLElement
    return { index: all.indexOf(active), checked: active?.getAttribute('aria-checked') }
  })
  expect(state.index).toBe(1)
  expect(state.checked).toBe('true')

  // Complete the whole run with keyboard only
  for (let q = 0; q < 6; q++) {
    const finishVisible = await page.getByRole('button', { name: /finish/i }).count()
    const nextBtn = page.getByRole('button', { name: /next/i })
    // choose first option if radios present
    const hasRadios = (await page.getByRole('radio').count()) > 0
    if (hasRadios) {
      // focus a radio and press Space to confirm activation works
      await page.getByRole('radio').first().focus()
      await page.keyboard.press('Space')
    }
    if (await nextBtn.count()) {
      await nextBtn.focus()
      await page.keyboard.press('Enter')
    } else if (finishVisible) {
      await page.getByRole('button', { name: /finish/i }).focus()
      await page.keyboard.press('Enter')
      break
    }
    await page.waitForTimeout(120)
  }
  await expect(page.getByText(/heard\. thank you\./i)).toBeVisible()
})

test('splash: first launch only, tap-skippable, no reappearance', async ({ page }) => {
  await page.goto('/')
  const splash = page.getByRole('button', { name: /tap to skip/i })
  await expect(splash).toBeVisible()
  await splash.click()
  await expect(splash).toBeHidden({ timeout: 1500 })
  // choose student and reload — splash must not return
  await page.getByText('Student', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.reload()
  await page.waitForTimeout(400)
  expect(await page.getByRole('button', { name: /tap to skip/i }).count()).toBe(0)
})

test('live region announces pulse progress', async ({ page }) => {
  await seedRole(page, 'student')
  await page.goto('/pulse')
  await page.waitForTimeout(700)
  const liveCount = await page.evaluate(() => document.querySelectorAll('[aria-live="polite"], [role="status"]').length)
  expect(liveCount).toBeGreaterThan(0)
})

test('touch targets ≥44px on chip controls', async ({ page }) => {
  await seedRole(page, 'teacher')
  await page.goto('/manage')
  await page.waitForTimeout(700)
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => (b.textContent ?? '').match(/Choice ·|Free text/) || b.getAttribute('aria-label')?.startsWith('Remove question'))
      .map((b) => b.getBoundingClientRect().height)
  )
  expect(heights.length).toBeGreaterThan(0)
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(44)
})
