import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Logo } from '@/components/Logo'
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
        <div className="flex flex-col items-center mb-6">
          <Logo href="/" size="md" tagline asLink={false} />
          <p className="text-muted text-sm mt-3 font-semibold">Hiring admin</p>
        </div>
        <div className="card p-6">
          <LoginForm next={next ?? '/admin'} />
        </div>
      </div>
    </main>
  )
}
