import Link from 'next/link'
import { PublicHeader, PublicFooter } from '@/components/PublicHeader'

export const metadata = { title: 'Application received' }

export default function ThanksPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1 grid place-items-center px-4 py-20">
        <div className="card p-10 text-center max-w-md">
          <div className="text-5xl mb-3">✅</div>
          <h1
            className="text-2xl font-bold text-espresso"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Application received
          </h1>
          <p className="text-muted mt-2">
            Thank you for applying to RJS Coffee Shop. Our team will review your
            responses and be in touch if there’s a match.
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Back to careers
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
