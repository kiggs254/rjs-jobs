import Link from 'next/link'

const H: Record<string, number> = { sm: 40, md: 56, lg: 80 }

// Renders the RJ's Coffee brand logo from /public/logo.png.
export function Logo({
  href = '/',
  size = 'sm',
  asLink = true,
}: {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  tagline?: boolean // accepted for call-site compatibility; the PNG already includes the tagline
  asLink?: boolean
}) {
  const px = H[size]
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="RJ's Coffee — Ready & Fresh"
      style={{ height: px, width: 'auto' }}
    />
  )

  if (!asLink) return <span className="inline-flex">{img}</span>
  return (
    <Link href={href} className="inline-flex items-center" aria-label="RJ's Coffee home">
      {img}
    </Link>
  )
}
