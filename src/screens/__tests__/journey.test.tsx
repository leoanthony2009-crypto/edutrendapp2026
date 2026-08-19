import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'

function seed(role: 'student' | 'teacher' | 'leader') {
  window.localStorage.setItem('bloom:v1:splashSeen', 'true')
  window.localStorage.setItem('bloom:v1:account', JSON.stringify({ role, name: 'Test User' }))
}

async function completeCarousel(user: ReturnType<typeof userEvent.setup>) {
  // Answer up to 5 questions: pick the first option when the question is a
  // choice, then advance. Free-text questions are optional and can be skipped.
  for (let i = 0; i < 6; i++) {
    const radios = screen.queryAllByRole('radio')
    if (radios.length > 0) await user.click(radios[0])
    const next = screen.queryByRole('button', { name: /next/i })
    if (next) {
      await user.click(next)
    } else {
      await user.click(screen.getByRole('button', { name: /finish/i }))
      return
    }
  }
}

beforeEach(() => {
  window.history.pushState({}, '', '/')
})

describe('student carousel journey', () => {
  it('runs open app → today → complete pulse → collates into Today + Trends', async () => {
    seed('student')
    const user = userEvent.setup()
    render(<App />)

    // Today (student) with the hero CTA
    await user.click(await screen.findByRole('button', { name: /start · your voice today/i }))

    // Carousel: one question per screen with a progress bar
    expect(await screen.findByText(/1 \/ \d/)).toBeInTheDocument()
    await completeCarousel(user)

    // Done state, role-specific copy
    expect(await screen.findByText(/heard\. thank you\./i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /see today's insights/i }))

    // Hero flips to the thanks state
    expect(await screen.findByText(/thank you — your voice was heard today/i)).toBeInTheDocument()

    // Trends shows the run collated in
    await user.click(screen.getAllByRole('link', { name: /trends/i })[0])
    expect(await screen.findByText(/collated from 166 pulse runs/i)).toBeInTheDocument()
  })
})

describe('teacher unlock journey', () => {
  it('teacher at 9 pulses completes one and the Survey Builder unlocks', async () => {
    seed('teacher')
    const user = userEvent.setup()
    render(<App />)

    // Locked promo card shows 9 of 10
    expect(await screen.findByText(/9 of 10 pulses completed/i)).toBeInTheDocument()

    // Complete the Daily Pulse
    await user.click(screen.getAllByRole('link', { name: /pulse/i })[0])
    expect(await screen.findByText(/1 \/ 5/)).toBeInTheDocument()
    await completeCarousel(user)
    expect(await screen.findByText(/^thank you$/i)).toBeInTheDocument()

    // One Child prompt appears (spec § 3.2) — skip it
    await user.click(screen.getByRole('button', { name: /skip/i }))
    await user.click(screen.getByRole('button', { name: /see today's insights/i }))

    // Promo card now unlocked; builder opens
    expect(await screen.findByText(/unlocked ✓/i)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /survey builder/i }))
    expect(await screen.findByText(/new survey/i)).toBeInTheDocument()

    // Launch flow: disabled until title present, then launches
    const launch = screen.getByRole('button', { name: /add a title and a question/i })
    expect(launch).toBeDisabled()
    await user.type(screen.getByPlaceholderText(/survey title/i), 'Homework load check')
    await user.click(screen.getByRole('button', { name: /launch survey/i }))
    expect(await screen.findByText(/survey launched/i)).toBeInTheDocument()
    const mine = screen.getByRole('region', { name: /your surveys/i })
    expect(within(mine).getByText(/homework load check/i)).toBeInTheDocument()
  })
})

describe('role gating', () => {
  it('students never reach the question manager or builder', async () => {
    seed('student')
    window.history.pushState({}, '', '/builder')
    render(<App />)
    // Redirected to Today
    expect(await screen.findByRole('heading', { name: /your voice today/i })).toBeInTheDocument()
    expect(screen.queryByText(/new survey/i)).not.toBeInTheDocument()
  })
})
