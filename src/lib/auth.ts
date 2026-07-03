import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SESSION_COOKIE,
  signSession,
  verifyToken,
  type SessionPayload,
} from './session-crypto'

export type { SessionPayload }
export { SESSION_COOKIE }

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

// For use at the top of admin server components / actions.
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/admin/login')
  return session
}
