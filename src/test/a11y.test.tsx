/**
 * Accessibility gate (jsdom stage). Every screen, in every role and key
 * state, must produce ZERO axe-core violations — running in `npm test` so an
 * inaccessible screen fails the build. Rendering happens against the REAL
 * API server, so audited states are the real ones.
 *
 * axe's color-contrast rule cannot compute styles in jsdom, so contrast is
 * enforced by the Playwright + axe browser stage (e2e/a11y.spec.ts).
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import App from '../App'
import { bootServer, signInAs, signOut, type TestServer } from './server'

let server: TestServer

beforeAll(async () => {
  server = await bootServer()
}, 30_000)
afterAll(async () => {
  await server.close()
})
beforeEach(() => {
  window.localStorage.setItem('bloom:v1:splashSeen', 'true')
  window.sessionStorage.clear()
  signOut()
})

const AXE_OPTIONS = {
  rules: {
    'color-contrast': { enabled: false }, // browser stage covers contrast
  },
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container, AXE_OPTIONS)
  expect(results.violations).toEqual([])
}

async function renderRoute(route: string) {
  window.history.pushState({}, '', route)
  const { container } = render(<App />)
  await screen.findAllByRole('heading', {}, { timeout: 5000 })
  return container
}

describe('accessibility gate: core journeys', () => {
  it('login screen', async () => {
    await expectNoViolations(await renderRoute('/'))
  })

  it('splash overlay (first launch, tap-skippable)', async () => {
    window.localStorage.removeItem('bloom:v1:splashSeen')
    window.history.pushState({}, '', '/')
    const { container } = render(<App />)
    await screen.findByRole('button', { name: /tap to skip/i })
    await expectNoViolations(container)
  })

  for (const [role, code] of [
    ['student', 's27'],
    ['teacher', 'teacher'],
    ['leader', 'leader'],
  ] as const) {
    it(`Today — ${role}`, async () => {
      await signInAs(server, 'STJ', code)
      await expectNoViolations(await renderRoute('/today'))
    })

    it(`Pulse carousel — ${role}`, async () => {
      await signInAs(server, 'STJ', code)
      await expectNoViolations(await renderRoute('/pulse'))
    })

    it(`Trends — ${role}`, async () => {
      await signInAs(server, 'STJ', code)
      await expectNoViolations(await renderRoute('/trends'))
    })

    it(`What's Hot — ${role}`, async () => {
      await signInAs(server, 'STJ', code)
      await expectNoViolations(await renderRoute('/hot'))
    })

    it(`Profile — ${role}`, async () => {
      await signInAs(server, 'STJ', code)
      await expectNoViolations(await renderRoute('/profile'))
    })
  }
})

describe('accessibility gate: teacher/leader surfaces', () => {
  it('question manager', async () => {
    await signInAs(server, 'STJ', 'teacher')
    await expectNoViolations(await renderRoute('/manage'))
  })

  it('survey builder — locked (teacher3 below 10 pulses)', async () => {
    await signInAs(server, 'STJ', 'teacher3')
    const container = await renderRoute('/builder')
    await screen.findByText(/blooms with your voice/i)
    await expectNoViolations(container)
  })

  it('survey builder — unlocked (leader)', async () => {
    await signInAs(server, 'STJ', 'leader')
    const container = await renderRoute('/builder')
    await screen.findByText(/new survey/i)
    await expectNoViolations(container)
  })

  it('survey results — real seeded survey', async () => {
    const leaderToken = await server.login('STJ', 'leader')
    const surveys = await server.api('GET', '/api/surveys', { token: leaderToken })
    const seeded = surveys.body.mine[0]
    await signInAs(server, 'STJ', 'leader')
    const container = await renderRoute(`/surveys/${seeded.id}/results`)
    await screen.findAllByText(/response/i)
    await expectNoViolations(container)
  })

  it('champion workspace with live queue', async () => {
    const teacherToken = await server.login('STJ', 'teacher2')
    await server.api('POST', '/api/tell-a-leader', { token: teacherToken, body: { note: 'a11y check note' } })
    await signInAs(server, 'STJ', 'leader')
    const container = await renderRoute('/champion')
    await screen.findByText(/a11y check note/i)
    await expectNoViolations(container)
  })

  it('weekly bridge', async () => {
    await signInAs(server, 'STJ', 'leader')
    const container = await renderRoute('/bridge')
    await screen.findByText(/synodal read/i)
    await expectNoViolations(container)
  })

  it('permission denied state', async () => {
    await signInAs(server, 'STJ', 's27')
    const container = await renderRoute('/champion')
    await screen.findByText(/isn't part of your role/i)
    await expectNoViolations(container)
  })
})

describe('accessibility gate: overlays and states', () => {
  it('tell-a-leader sheet', async () => {
    await signInAs(server, 'STJ', 'teacher')
    const container = await renderRoute('/today')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /tell a leader/i }))
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('teacher perks sheet (sample-labelled)', async () => {
    await signInAs(server, 'STJ', 'teacher')
    const container = await renderRoute('/profile')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /teacher perks/i }))
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('micro-learning shot modal', async () => {
    await signInAs(server, 'STJ', 'teacher')
    const container = await renderRoute('/hot')
    const user = userEvent.setup()
    const buttons = await screen.findAllByRole('button', { name: /break-time hotspots|sba stress|buddy scheme/i })
    await user.click(buttons[0])
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('free-text question (textarea) in the carousel', async () => {
    await signInAs(server, 'STJ', 'teacher')
    const container = await renderRoute('/pulse')
    const user = userEvent.setup()
    for (let i = 0; i < 5; i++) {
      if (screen.queryByRole('textbox')) break
      const radios = screen.queryAllByRole('radio')
      if (radios.length) await user.click(radios[0])
      await user.click(screen.getByRole('button', { name: /next/i }))
    }
    expect(await screen.findByRole('textbox')).toBeInTheDocument()
    await expectNoViolations(container)
  })
})
