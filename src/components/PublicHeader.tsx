import { Logo } from './ui'

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-white/60 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo href="/" />
        <span className="text-sm text-muted hidden sm:inline">Careers</span>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} RJS Coffee Shop</span>
        <span>Brewed with care in Kenya ☕</span>
      </div>
    </footer>
  )
}
