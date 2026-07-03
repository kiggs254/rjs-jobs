// Edge-safe session token helpers (no next/headers, no server-only).
// Used by middleware AND by the server-only auth wrapper.
import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'rjs_admin_session'
const ALG = 'HS256'

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short (set a long random string)')
  }
  return new TextEncoder().encode(s)
}

export interface SessionPayload {
  sub: string
  email: string
  name: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] })
    if (typeof payload.sub !== 'string') return null
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
    }
  } catch {
    return null
  }
}
