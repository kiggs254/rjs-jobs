import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { logoutAction } from './actions'
import { Logo } from '@/components/ui'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <div className="min-h-full flex flex-col">
      {session && (
        <header className="border-b border-line bg-white/70 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Logo href="/admin" />
              <nav className="hidden sm:flex items-center gap-4 text-sm">
                <Link href="/admin" className="text-coffee hover:text-accent">
                  Jobs
                </Link>
                <Link
                  href="/"
                  className="text-muted hover:text-accent"
                  target="_blank"
                >
                  View site ↗
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted hidden sm:inline">{session.name}</span>
              <form action={logoutAction}>
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.7rem' }}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  )
}
