/**
 * Browser-level security and integrity checks (audit P0-1/P0-2/P0-3 and
 * Phase 10): authorization is server-enforced, safeguarding text never
 * touches persistent browser storage, and once-daily holds across devices.
 */
import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('client-side tampering cannot grant Champion access', async ({ page }) => {
  await login(page, 'STJ', 's13')
  await page.goto('/today')
  await page.waitForTimeout(700)

  // Tamper with everything client-side available
  await page.evaluate(() => {
    localStorage.setItem('role', 'leader')
    localStorage.setItem('bloom:v1:account', JSON.stringify({ role: 'leader', isChampion: true }))
  })
  await page.goto('/champion')
  await page.waitForTimeout(700)
  await expect(page.getByText(/isn't part of your role/i)).toBeVisible()

  // Direct API attempts from the tampered client still fail server-side
  const status = await page.evaluate(async () => {
    const res = await fetch('/api/champion/overview', { headers: { 'x-bloom-client': '1' }, credentials: 'include' })
    return res.status
  })
  expect(status).toBe(403)
})

test('cross-school data is unreachable by ID manipulation from the browser', async ({ page, request }) => {
  // Create an STJ alert
  const stjLogin = await request.post('/api/auth/login', {
    headers: { 'x-bloom-client': '1' },
    data: { schoolCode: 'STJ', userCode: 'teacher3', passcode: 'petal-teacher3' },
  })
  const { token } = await stjLogin.json()
  const created = await request.post('/api/tell-a-leader', {
    headers: { 'x-bloom-client': '1', authorization: `Bearer ${token}` },
    data: { note: 'cross-school e2e probe' },
  })
  const { alertId } = await created.json()

  // Holy Cross champion tries to read it by id from their browser session
  await login(page, 'HCR', 'leader')
  await page.goto('/today')
  const status = await page.evaluate(async (id) => {
    const res = await fetch(`/api/champion/alerts/${id}/events`, { headers: { 'x-bloom-client': '1' }, credentials: 'include' })
    return res.status
  }, alertId)
  expect(status).toBe(404)
})

test('disclosure text never lands in persistent browser storage', async ({ page }) => {
  await login(page, 'STJ', 'teacher3')
  await page.goto('/today')
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: /tell a leader/i }).click()
  await page.locator('textarea').fill('E2E-SENSITIVE a pupil disclosed something')
  await page.getByRole('button', { name: /send to champion/i }).click()
  await expect(page.getByText(/read this within 24 hours/i)).toBeVisible()
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))
  expect(storage).not.toContain('E2E-SENSITIVE')
})

test('pulse free-text drafts stay out of localStorage (sessionStorage only, cleared on submit)', async ({ page }) => {
  await login(page, 'STJ', 'teacher2')
  await page.goto('/pulse')
  await page.waitForTimeout(900)
  // advance to a free-text question and type into it
  for (let i = 0; i < 5; i++) {
    if (await page.locator('textarea').count()) break
    const radios = await page.getByRole('radio').all()
    if (radios.length) await radios[0].click()
    await page.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(120)
  }
  await page.locator('textarea').fill('DRAFT-SENSITIVE words in progress')
  await page.waitForTimeout(200)
  const local = await page.evaluate(() => JSON.stringify({ ...localStorage }))
  expect(local).not.toContain('DRAFT-SENSITIVE')
})

test('once-daily across devices: a second browser session sees the completed state', async ({ browser }) => {
  const deviceA = await browser.newContext()
  const pageA = await deviceA.newPage()
  await login(pageA, 'STJ', 's14')
  await pageA.goto('http://localhost:4173/pulse')
  await pageA.waitForTimeout(900)
  for (let i = 0; i < 6; i++) {
    const radios = await pageA.getByRole('radio').all()
    if (radios.length) await radios[0].click()
    const next = pageA.getByRole('button', { name: /next/i })
    if (await next.count()) await next.click()
    else {
      await pageA.getByRole('button', { name: /^finish$/i }).click()
      break
    }
    await pageA.waitForTimeout(120)
  }
  await expect(pageA.getByText(/heard\. thank you\./i)).toBeVisible({ timeout: 5000 })
  await deviceA.close()

  // Fresh context = fresh cookies + empty storage (a different device)
  const deviceB = await browser.newContext()
  const pageB = await deviceB.newPage()
  await login(pageB, 'STJ', 's14')
  await pageB.goto('http://localhost:4173/pulse')
  await pageB.waitForTimeout(900)
  await expect(pageB.getByText(/today's pulse is in/i)).toBeVisible()
  await expect(pageB.getByRole('button', { name: /edit today's answers/i })).toBeVisible()
  await deviceB.close()
})

test('champion journey in the browser: queue → ack → teacher receipt visible', async ({ browser }) => {
  // Teacher sends a note
  const teacherCtx = await browser.newContext()
  const teacherPage = await teacherCtx.newPage()
  await login(teacherPage, 'STJ', 'teacher')
  await teacherPage.goto('http://localhost:4173/today')
  await teacherPage.waitForTimeout(900)
  await teacherPage.getByRole('button', { name: /tell a leader/i }).click()
  await teacherPage.locator('textarea').fill('Browser journey: corridor check please')
  await teacherPage.getByRole('button', { name: /send to champion/i }).click()
  await expect(teacherPage.getByText(/read this within 24 hours/i)).toBeVisible()

  // Champion acknowledges in their own session
  const champCtx = await browser.newContext()
  const champPage = await champCtx.newPage()
  await login(champPage, 'STJ', 'leader')
  await champPage.goto('http://localhost:4173/champion')
  await champPage.waitForTimeout(900)
  const alertRow = champPage.locator('li', { hasText: 'corridor check please' })
  await expect(alertRow).toBeVisible()
  await alertRow.getByRole('button', { name: /mark as read/i }).click()
  await champPage.waitForTimeout(500)

  // Teacher sees the read receipt on Today
  await teacherPage.goto('http://localhost:4173/today')
  await teacherPage.waitForTimeout(900)
  await expect(teacherPage.getByText(/read by your champion/i).first()).toBeVisible()

  await teacherCtx.close()
  await champCtx.close()
})
