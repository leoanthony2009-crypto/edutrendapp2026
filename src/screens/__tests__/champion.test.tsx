import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { storage } from '../../services/storage'
import { queueAlert } from '../../services/champion'

const HOUR = 3_600_000

function seed(role: 'student' | 'teacher' | 'leader') {
  window.localStorage.setItem('bloom:v1:splashSeen', 'true')
  window.localStorage.setItem('bloom:v1:account', JSON.stringify({ role, name: 'Test User' }))
}

beforeEach(() => {
  window.history.pushState({}, '', '/champion')
  storage.set('championAlerts', [])
  storage.set('oneChildEntries', [])
  storage.set('watchlistActions', {})
})

describe('FIX 1 — Champion workspace', () => {
  it('is gated: teachers and students are redirected to Today', async () => {
    seed('teacher')
    render(<App />)
    expect(await screen.findByRole('heading', { name: /today's insights/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /champion workspace/i })).not.toBeInTheDocument()
  })

  it('shows the leader alerts triaged by SLA remaining', async () => {
    const now = Date.now()
    queueAlert({ triggerType: 'free_text', context: 'Fresh alert', marks: ['L'], now: new Date(now) })
    queueAlert({ triggerType: 'safeguarding', context: 'Oldest alert, least time', marks: ['L'], now: new Date(now - 20 * HOUR) })
    seed('leader')
    render(<App />)
    const list = await screen.findByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Oldest alert, least time')
    expect(items[1]).toHaveTextContent('Fresh alert')
  })

  it('acknowledges an alert and requires an outcome note to close it', async () => {
    queueAlert({ triggerType: 'free_text', context: 'A pupil seemed withdrawn', marks: ['L'] })
    seed('leader')
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /mark as read/i }))
    expect(await screen.findByText(/acknowledged/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /log an outcome/i }))
    await user.click(screen.getByRole('button', { name: /close alert/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/outcome note is required/i)

    await user.type(screen.getByLabelText(/outcome note/i), 'Spoke with the pupil at first break')
    await user.click(screen.getByRole('button', { name: /close alert/i }))
    expect(await screen.findByText(/never exported/i)).toBeInTheDocument()
    expect(screen.getByText(/0 awaiting your read · 1 handled/i)).toBeInTheDocument()
  })

  it('lets the Champion set a watchlist action per pupil', async () => {
    const day = 24 * HOUR
    const entries = ['a', 'b', 'c'].map((staff, i) => ({
      pupilHandle: 'F2-073',
      yearGroup: 'F2',
      notedFor: 'quiet',
      submittedBy: `teacher-${staff}`,
      submittedAt: new Date(Date.now() - i * day).toISOString(),
    }))
    storage.set('oneChildEntries', entries)
    seed('leader')
    const user = userEvent.setup()
    render(<App />)

    const group = await screen.findByRole('radiogroup', { name: /champion action for F2-073/i })
    await user.click(within(group).getByRole('radio', { name: 'Parent contact' }))
    expect(within(group).getByRole('radio', { name: 'Parent contact' })).toHaveAttribute('aria-checked', 'true')
  })
})
