/**
 * FIX 2 — Accessibility gate.
 *
 * Every screen, in every role and key state, must produce ZERO axe-core
 * violations. This suite runs in `npm test`, so an inaccessible screen fails
 * the build. New screens must be added to the matrix below.
 *
 * Note: axe's color-contrast rule cannot compute styles in jsdom, so it is
 * disabled here; contrast is enforced by the token palette (DESIGN_REVIEW
 * P1.2 — metadata ink darkened to ≥4.5:1) and checked in browser passes.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import App from '../App'

const AXE_OPTIONS = {
  rules: {
    'color-contrast': { enabled: false },
  },
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe(container, AXE_OPTIONS)
  expect(results.violations).toEqual([])
}

function seed(role: 'student' | 'teacher' | 'leader' | null, extra: Record<string, unknown> = {}) {
  window.localStorage.clear()
  window.localStorage.setItem('bloom:v1:splashSeen', 'true')
  if (role) window.localStorage.setItem('bloom:v1:account', JSON.stringify({ role, name: 'A11y Test' }))
  for (const [key, value] of Object.entries(extra)) {
    window.localStorage.setItem(`bloom:v1:${key}`, JSON.stringify(value))
  }
}

async function renderRoute(route: string) {
  window.history.pushState({}, '', route)
  const { container } = render(<App />)
  // Wait out the skeleton state so the real surface is audited.
  await screen.findAllByRole('heading', {}, { timeout: 3000 })
  return container
}

describe('accessibility gate: core journeys', () => {
  it('role sign-in', async () => {
    seed(null)
    await expectNoViolations(await renderRoute('/'))
  })

  it('splash overlay (first launch)', async () => {
    seed(null)
    window.localStorage.removeItem('bloom:v1:splashSeen')
    window.history.pushState({}, '', '/')
    const { container } = render(<App />)
    await screen.findByRole('status')
    await expectNoViolations(container)
  })

  for (const role of ['student', 'teacher', 'leader'] as const) {
    it(`Today — ${role}`, async () => {
      seed(role)
      await expectNoViolations(await renderRoute('/today'))
    })

    it(`Pulse carousel — ${role}`, async () => {
      seed(role)
      await expectNoViolations(await renderRoute('/pulse'))
    })

    it(`Trends — ${role}`, async () => {
      seed(role)
      await expectNoViolations(await renderRoute('/trends'))
    })

    it(`What's Hot — ${role}`, async () => {
      seed(role)
      await expectNoViolations(await renderRoute('/hot'))
    })

    it(`Profile — ${role}`, async () => {
      seed(role)
      await expectNoViolations(await renderRoute('/profile'))
    })
  }
})

describe('accessibility gate: teacher/leader surfaces', () => {
  it('question manager', async () => {
    seed('teacher')
    await expectNoViolations(await renderRoute('/manage'))
  })

  it('survey builder — locked', async () => {
    seed('teacher', { pulsesCompleted: { student: 0, teacher: 3, leader: 0 } })
    await expectNoViolations(await renderRoute('/builder'))
  })

  it('survey builder — unlocked', async () => {
    seed('leader')
    await expectNoViolations(await renderRoute('/builder'))
  })

  it('champion workspace (FIX 1)', async () => {
    seed('leader')
    await expectNoViolations(await renderRoute('/champion'))
  })

  it('champion workspace — outcome form open', async () => {
    seed('leader')
    const container = await renderRoute('/champion')
    const user = userEvent.setup()
    await user.click((await screen.findAllByRole('button', { name: /log an outcome/i }))[0])
    await screen.findByLabelText(/outcome note/i)
    await expectNoViolations(container)
  })
})

describe('accessibility gate: overlays and states', () => {
  it('free-text question (textarea) in the carousel', async () => {
    seed('teacher')
    const container = await renderRoute('/pulse')
    const user = userEvent.setup()
    // Walk to the first free-text question (teacher q2 is one-word/free text).
    for (let i = 0; i < 4; i++) {
      if (screen.queryByRole('textbox')) break
      const radios = screen.queryAllByRole('radio')
      if (radios.length) await user.click(radios[0])
      await user.click(screen.getByRole('button', { name: /next/i }))
    }
    expect(await screen.findByRole('textbox')).toBeInTheDocument()
    await expectNoViolations(container)
  })

  it('micro-learning shot modal', async () => {
    seed('teacher')
    const container = await renderRoute('/hot')
    const user = userEvent.setup()
    await user.click((await screen.findAllByRole('button', { name: /micro-learning shot/i }))[0])
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('national report overlay', async () => {
    seed('leader')
    const container = await renderRoute('/hot')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /national report/i }))
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('teacher perks sheet', async () => {
    seed('teacher')
    const container = await renderRoute('/profile')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /teacher perks/i }))
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('tell-a-leader sheet', async () => {
    seed('teacher')
    const container = await renderRoute('/today')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /tell a leader/i }))
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('pulse done state + one child form', async () => {
    seed('teacher')
    const container = await renderRoute('/pulse')
    const user = userEvent.setup()
    for (let i = 0; i < 6; i++) {
      const radios = screen.queryAllByRole('radio')
      if (radios.length) await user.click(radios[0])
      const next = screen.queryByRole('button', { name: /next/i })
      if (next) await user.click(next)
      else {
        await user.click(screen.getByRole('button', { name: /finish/i }))
        break
      }
    }
    await screen.findByText(/is there a child you went home thinking about/i)
    await expectNoViolations(container)
  })

  it('empty carousel state', async () => {
    seed('teacher', { banks: { student: [], teacher: [], leader: [] } })
    window.history.pushState({}, '', '/pulse')
    const { container } = render(<App />)
    await screen.findByText(/today's voice is still gathering/i)
    await expectNoViolations(container)
  })
})
