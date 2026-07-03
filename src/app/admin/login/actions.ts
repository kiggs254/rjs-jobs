'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export interface LoginState {
  error?: string
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const nextRaw = String(formData.get('next') ?? '/admin')
  // Only allow internal redirects.
  const next =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/admin'

  if (!email || !password) return { error: 'Enter your email and password.' }

  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? 'local').split(',')[0].trim()
  if (!rateLimit(`login:${ip}`, 8, 60_000)) {
    return { error: 'Too many attempts. Please wait a minute and try again.' }
  }

  const admin = await prisma.admin.findUnique({ where: { email } })
  // Constant-ish work whether or not the user exists.
  const ok = admin
    ? await bcrypt.compare(password, admin.passwordHash)
    : await bcrypt.compare(password, '$2a$12$0000000000000000000000000000000000000000000000000000')

  if (!admin || !ok) return { error: 'Invalid email or password.' }

  await createSession({ sub: admin.id, email: admin.email, name: admin.name })
  redirect(next)
}
