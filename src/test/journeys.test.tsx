import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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
  window.history.pushState({}, '', '/')
  signOut()
})

async function completeCarousel(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 7; i++) {
    const radios = screen.queryAllByRole('radio')
    if (radios.length > 0) await user.click(radios[0])
    const next = screen.queryByRole('button', { name: /next/i })
    if (next) {
      await user.click(next)
    } else {
      await user.click(screen.getByRole('button', { name: /^finish$/i }))
      return
    }
  }
}

describe('authentication journeys (real server)', () => {
  it('shows the login screen when signed out and rejects bad credentials', async () => {
    render(<App />)
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Bloom' })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/personal code/i), 'teacher')
    await user.type(screen.getByLabelText(/passcode/i), 'wrong-pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not recognised/i)
  })

  it('signs in through the form and lands on the role Today screen', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /leader · champion/i }))
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('heading', { name: /leadership view/i })).toBeInTheDocument()
  })
})

describe('student pulse journey (end-to-end against the server)', () => {
  it('open app → today → complete pulse → done state → edit-until-midnight state', async () => {
    await signInAs(server, 'STJ', 's25')
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /start · your voice today/i }))
    expect(await screen.findByText(/1 \/ \d/)).toBeInTheDocument()
    await completeCarousel(user)
    expect(await screen.findByText(/heard\. thank you\./i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /see today's insights/i }))
    expect(await screen.findByText(/thank you — your voice was heard today/i)).toBeInTheDocument()

    // Pulse tab now shows the completed-until-midnight state with edit
    await user.click(screen.getAllByRole('link', { name: /pulse/i })[0])
    expect(await screen.findByText(/today's pulse is in/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit today's answers/i })).toBeInTheDocument()
  })

  it('a student never reaches builder, manager or champion surfaces', async () => {
    await signInAs(server, 'STJ', 's26')
    window.history.pushState({}, '', '/champion')
    render(<App />)
    expect(await screen.findByText(/isn't part of your role/i)).toBeInTheDocument()
  })
})

describe('teacher unlock and survey journey', () => {
  it('teacher at 9 pulses completes one, unlocks the builder, launches a survey with results link', async () => {
    await signInAs(server, 'STJ', 'teacher')
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText(/9 of 10 pulses completed/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('link', { name: /pulse/i })[0])
    await screen.findByText(/1 \/ \d/)
    await completeCarousel(user)
    expect(await screen.findByRole('heading', { name: /^thank you$/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /skip/i }))
    await user.click(screen.getByRole('button', { name: /see today's insights/i }))

    expect(await screen.findByText(/unlocked ✓/i)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /survey builder/i }))
    expect(await screen.findByText(/new survey/i)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/survey title/i), 'Homework load check')
    await user.click(screen.getByRole('button', { name: /launch survey/i }))
    expect(await screen.findByText(/survey launched/i)).toBeInTheDocument()
    const region = await screen.findByRole('region', { name: /your surveys/i })
    expect(region).toHaveTextContent(/homework load check/i)
    expect(region).toHaveTextContent(/live/i)
  }, 20_000)
})

describe('champion journey (server-backed, with receipts)', () => {
  it('teacher note → champion queue → acknowledge → close with note → audit; teacher sees Read ✓', async () => {
    // Teacher sends a note
    const teacherToken = await server.login('STJ', 'teacher2')
    await server.api('POST', '/api/tell-a-leader', { token: teacherToken, body: { note: 'jsdom journey note' } })

    // Champion works the queue in the UI
    await signInAs(server, 'STJ', 'leader')
    window.history.pushState({}, '', '/champion')
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: /champion workspace/i })).toBeInTheDocument()
    expect(await screen.findByText(/jsdom journey note/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /mark as read/i })[0])
    await waitFor(async () => {
      expect((await server.api('GET', '/api/my-reports', { token: teacherToken })).body.reports[0].readAt).toBeTruthy()
    })

    await user.click(screen.getAllByRole('button', { name: /log an outcome/i })[0])
    await user.click(screen.getByRole('button', { name: /close alert/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/outcome note is required/i)
    await user.type(screen.getByLabelText(/outcome note/i), 'Spoke with the form teacher at break')
    await user.click(screen.getByRole('button', { name: /close alert/i }))
    expect(await screen.findByText(/never exported/i)).toBeInTheDocument()
  }, 20_000)
})

describe('sensitive data stays off the device', () => {
  it('after a full journey, no disclosure text exists in browser storage', async () => {
    const token = await signInAs(server, 'STJ', 'teacher3')
    void token
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /tell a leader/i }))
    await user.type(await screen.findByLabelText(/optional note/i), 'STORAGE-CHECK sensitive words')
    await user.click(screen.getByRole('button', { name: /send to champion/i }))
    expect(await screen.findByText(/read this within 24 hours/i)).toBeInTheDocument()
    const allStorage = JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage })
    expect(allStorage).not.toContain('STORAGE-CHECK')
  })
})
