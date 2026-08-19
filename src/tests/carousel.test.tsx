import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PulseCarousel } from '../screens/PulseCarousel'
import { SessionContext } from '../SessionContext'
import { signIn } from '../services/auth'
import { getCurrentSubmission, getPulsesCompleted } from '../services/pulses'
import { getAlerts } from '../services/champion'
import type { Role } from '../types/pulse'

function renderCarousel(role: Role) {
  const session = signIn(role)
  return render(
    <SessionContext.Provider value={{ session, refreshSession: () => {} }}>
      <MemoryRouter initialEntries={['/pulse']}>
        <PulseCarousel />
      </MemoryRouter>
    </SessionContext.Provider>,
  )
}

describe('pulse carousel journey (teacher)', () => {
  it('walks the Daily Pulse end to end: answer → next → finish → collated + counted', async () => {
    const user = userEvent.setup()
    renderCarousel('teacher')

    // Q1 — scale choice
    expect(await screen.findByText('Was your classroom workable today (heat, light, space, supplies)?')).toBeInTheDocument()
    // Next is a no-op until an answer is picked on choice questions.
    expect(screen.getByRole('button', { name: 'Pick an answer' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: 'Mostly' }))
    await user.click(screen.getByRole('button', { name: 'Next →' }))

    // Q2 — free text (textarea, optional)
    expect(screen.getByText('How are you, in one word, today?')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Type here — a word or a sentence'), 'steady')
    await user.click(screen.getByRole('button', { name: 'Next →' }))

    // Q3 — scale choice
    await user.click(screen.getByRole('radio', { name: 'Fully' }))
    await user.click(screen.getByRole('button', { name: 'Next →' }))

    // Q4 — free text, skipped
    await user.click(screen.getByRole('button', { name: 'Next →' }))

    // Q5 — free text with Champion trigger
    await user.type(
      screen.getByPlaceholderText('Type here — a word or a sentence'),
      'A pupil seemed withdrawn and scared today',
    )
    await user.click(screen.getByRole('button', { name: 'Finish' }))

    // Done state
    expect(await screen.findByText('Thank you')).toBeInTheDocument()

    // The run collated: submission stored with a positive-first score, counter bumped.
    const submission = getCurrentSubmission('teacher')
    expect(submission).not.toBeNull()
    expect(submission!.score).toBe(88) // Mostly (0.75) + Fully (1) → 87.5 → 88
    expect(getPulsesCompleted('teacher')).toBe(1)

    // Distress language reached the Champion queue.
    const alerts = getAlerts()
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts.some((a) => a.triggerType === 'free_text')).toBe(true)
    expect(screen.getByText(/read by your Pastoral Champion within 24 hours/i)).toBeInTheDocument()
  })

  it('supports going back to change an earlier answer', async () => {
    const user = userEvent.setup()
    renderCarousel('teacher')

    await user.click(await screen.findByRole('radio', { name: 'Barely' }))
    await user.click(screen.getByRole('button', { name: 'Next →' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('radio', { name: 'Barely' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: 'Fully' }))
    expect(screen.getByRole('radio', { name: 'Fully' })).toHaveAttribute('aria-checked', 'true')
  })
})

describe('pulse carousel (student)', () => {
  it('serves the rotated student set and reopens for review after submitting', async () => {
    const user = userEvent.setup()
    renderCarousel('student')

    const heading = await screen.findByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Your Voice Today')

    // Answer every question in the rotated set (choice → first option; free text → skip).
    for (let guard = 0; guard < 6; guard++) {
      if (screen.queryByText('Heard. Thank you.')) break
      const radios = screen.queryAllByRole('radio')
      if (radios.length > 0) await user.click(radios[0])
      const next = screen.queryByRole('button', { name: /Next →|Finish/ })
      if (next) await user.click(next)
    }

    expect(await screen.findByText('Heard. Thank you.')).toBeInTheDocument()
    expect(getCurrentSubmission('student')).not.toBeNull()
    // Once-a-day contract: the done screen offers review, never a fresh run.
    expect(screen.queryByText(/run again/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Review my answers/ })).toBeInTheDocument()
  })
})
