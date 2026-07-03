import { Logo } from './Logo'

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo href="/" size="sm" />
        <span className="text-sm font-semibold text-muted hidden sm:inline">
          Careers
        </span>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} RJ&rsquo;s Coffee</span>
        <span className="script text-base">Ready &amp; Fresh</span>
      </div>
    </footer>
  )
}
