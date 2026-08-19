/**
 * Real-browser WCAG 2.2 AA gate: axe-core WITH color contrast, per
 * role/route, plus keyboard-only interaction coverage the jsdom gate cannot
 * provide. Runs against the real API server. Failing here fails the release.
 */
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, skipSplashOnly } from './helpers'

const MATRIX: Array<[string, string, string]> = [
  ['STJ', 's10', '/today'],
  ['STJ', 's10', '/pulse'],
  ['STJ', 's10', '/trends'],
  ['STJ', 's10', '/hot'],
  ['STJ', 's10', '/profile'],
  ['STJ', 'teacher2', '/today'],
  ['STJ', 'teacher2', '/pulse'],
  ['STJ', 'teacher2', '/manage'],
  ['STJ', 'teacher2', '/builder'],
  ['STJ', 'teacher2', '/trends'],
  ['STJ', 'leader', '/today'],
  ['STJ', 'leader', '/champion'],
  ['STJ', 'leader', '/builder'],
  ['STJ', 'leader', '/bridge'],
  ['STJ', 'leader', '/profile'],
]

for (const [school, code, route] of MATRIX) {
  test(`axe clean (incl. contrast): ${code} ${route}`, async ({ page }) => {
    await login(page, school, code)
    await page.goto(route)
    await page.waitForTimeout(900)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })
}

test('axe clean: login screen', async ({ page }) => {
  await skipSplashOnly(page)
  await page.goto('/')
  await page.waitForTimeout(600)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
})

test('keyboard-only pulse completion with arrow-key radiogroup', async ({ page }) => {
  await login(page, 'STJ', 's11')
  await page.goto('/pulse')
  await page.waitForTimeout(900)

  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    const role = await page.evaluate(() => document.activeElement?.getAttribute('role'))
    if (role === 'radio') break
  }
  await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('radio')

  await page.keyboard.press('ArrowDown')
  const state = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[role="radio"]')]
    const active = document.activeElement as HTMLElement
    return { index: all.indexOf(active), checked: active?.getAttribute('aria-checked') }
  })
  expect(state.index).toBe(1)
  expect(state.checked).toBe('true')

  for (let q = 0; q < 6; q++) {
    const hasRadios = (await page.getByRole('radio').count()) > 0
    if (hasRadios) {
      await page.getByRole('radio').first().focus()
      await page.keyboard.press('Space')
    }
    const nextBtn = page.getByRole('button', { name: /next/i })
    if (await nextBtn.count()) {
      await nextBtn.focus()
      await page.keyboard.press('Enter')
    } else {
      await page.getByRole('button', { name: /^finish$/i }).focus()
      await page.keyboard.press('Enter')
      break
    }
    await page.waitForTimeout(150)
  }
  await expect(page.getByText(/heard\. thank you\./i)).toBeVisible({ timeout: 5000 })
})

test('splash: first launch only, tap-skippable', async ({ page }) => {
  await page.goto('/')
  const splash = page.getByRole('button', { name: /tap to skip/i })
  await expect(splash).toBeVisible()
  await splash.click()
  await expect(splash).toBeHidden({ timeout: 1500 })
  await page.reload()
  await page.waitForTimeout(400)
  expect(await page.getByRole('button', { name: /tap to skip/i }).count()).toBe(0)
})

test('live region announces pulse progress', async ({ page }) => {
  await login(page, 'STJ', 's12')
  await page.goto('/pulse')
  await page.waitForTimeout(900)
  const liveCount = await page.evaluate(() => document.querySelectorAll('[aria-live="polite"], [role="status"]').length)
  expect(liveCount).toBeGreaterThan(0)
})

test('touch targets ≥44px on chip controls', async ({ page }) => {
  await login(page, 'STJ', 'teacher2')
  await page.goto('/manage')
  await page.waitForTimeout(900)
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => (b.textContent ?? '').match(/Choice ·|Free text/) || b.getAttribute('aria-label')?.startsWith('Remove question'))
      .map((b) => b.getBoundingClientRect().height)
  )
  expect(heights.length).toBeGreaterThan(0)
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(44)
})
