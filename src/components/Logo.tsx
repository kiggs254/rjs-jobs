'use client'

import Link from 'next/link'
import { useState } from 'react'

const H: Record<string, number> = { sm: 36, md: 48, lg: 72 }

// A red line-art coffee cup, echoing the logo mark (no emoji).
function CupMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 19h24v9a10 10 0 0 1-10 10h-4A10 10 0 0 1 9 28v-9Z"
        stroke="var(--color-brand-red)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M33 21h4a5 5 0 0 1 0 10h-4"
        stroke="var(--color-brand-red)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M16 6c-1.6 2.2-1.6 4.3 0 6.5M23 5c-1.8 2.4-1.8 4.7 0 7M30 6c-1.6 2.2-1.6 4.3 0 6.5"
        stroke="var(--color-brand-green)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Themed fallback wordmark used until a real /logo.png is present.
function Wordmark({ size, tagline }: { size: number; tagline?: boolean }) {
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span className="inline-flex items-center gap-1.5">
        <CupMark size={size} />
        <span
          className="font-extrabold tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-brand-red)',
            fontSize: size * 0.62,
          }}
        >
          RJ&rsquo;s
        </span>
        <span
          className="font-extrabold text-white rounded"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'var(--color-brand-black)',
            letterSpacing: '0.08em',
            fontSize: size * 0.4,
            padding: `${size * 0.06}px ${size * 0.16}px`,
          }}
        >
          COFFEE
        </span>
      </span>
      {tagline && (
        <span className="script" style={{ fontSize: size * 0.42, marginTop: size * 0.06 }}>
          Ready &amp; Fresh
        </span>
      )}
    </span>
  )
}

export function Logo({
  href = '/',
  size = 'sm',
  tagline = false,
  asLink = true,
}: {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  tagline?: boolean
  asLink?: boolean
}) {
  // Show the themed wordmark by default; upgrade to /logo.png ONLY once it
  // actually loads. This avoids the browser's broken-image icon when the file
  // is absent (onError can't be relied on — a 404 fires before hydration).
  const [loaded, setLoaded] = useState(false)
  const px = H[size]

  const inner = (
    <span className="inline-flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="RJ's Coffee — Ready & Fresh"
        style={{ height: px, width: 'auto', display: loaded ? 'block' : 'none' }}
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth > 1) setLoaded(true)
        }}
        onError={() => setLoaded(false)}
      />
      {!loaded && <Wordmark size={px} tagline={tagline} />}
    </span>
  )

  if (!asLink) return <span className="inline-flex">{inner}</span>
  return (
    <Link href={href} className="inline-flex items-center" aria-label="RJ's Coffee home">
      {inner}
    </Link>
  )
}
