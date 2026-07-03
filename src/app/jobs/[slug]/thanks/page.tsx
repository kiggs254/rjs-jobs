import Link from 'next/link'
import { PublicHeader, PublicFooter } from '@/components/PublicHeader'

export const metadata = { title: 'Application received' }

export default function ThanksPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1 grid place-items-center px-4 py-20">
        <div className="card p-10 text-center max-w-md">
          <CheckMark />
          <h1
            className="text-2xl font-extrabold text-espresso mt-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Application received
          </h1>
          <p className="text-muted mt-2">
            Thank you for applying to RJ&rsquo;s Coffee. Our team will review your
            responses and be in touch if there&rsquo;s a match.
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

function CheckMark() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      className="mx-auto"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="var(--color-brand-green)" opacity="0.12" />
      <circle cx="32" cy="32" r="22" fill="var(--color-brand-green)" />
      <path
        d="M23 32.5l6 6 12-13"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
