// @ts-expect-error — plain ESM server module without type declarations
import { startServer } from '../../server/__tests__/helpers.mjs'
import { setBearer } from '../services/api'

export interface TestServer {
  baseUrl: string
  db: unknown
  api: (method: string, path: string, opts?: { token?: string; body?: unknown }) => Promise<{ status: number; body: any }>
  login: (schoolCode: string, userCode: string, passcode?: string) => Promise<string>
  close: () => Promise<void>
}

/**
 * Frontend tests run against the REAL API server (in-memory database, real
 * routes, real authorization) — no mocks. jsdom's fetch has no cookie jar,
 * so the client rides the bearer token that login returns.
 */
export async function bootServer(): Promise<TestServer> {
  const server = (await startServer()) as TestServer
  globalThis.__BLOOM_API_BASE__ = server.baseUrl
  return server
}

export async function signInAs(server: TestServer, schoolCode: string, userCode: string): Promise<string> {
  const token = await server.login(schoolCode, userCode)
  setBearer(token)
  return token
}

export function signOut(): void {
  setBearer(null)
}
