import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LoginForm from './LoginForm'

export const metadata = { title: 'Admin sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession()
  if (session) redirect('/admin')
  const { next } = await searchParams

  return (
    <main className="flex-1 grid place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">☕</div>
          <h1
            className="text-2xl font-bold text-espresso"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            RJS Coffee Shop
          </h1>
          <p className="text-muted text-sm">Hiring admin</p>
        </div>
        <div className="card p-6">
          <LoginForm next={next ?? '/admin'} />
        </div>
      </div>
    </main>
  )
}
