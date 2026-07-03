import Link from 'next/link'
import { prisma } from '@/lib/db'
import { PublicHeader, PublicFooter } from '@/components/PublicHeader'
import { EMPLOYMENT_LABEL } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const jobs = await prisma.job.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  })

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
          <div className="text-5xl mb-4">☕</div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-espresso leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Work at RJS Coffee Shop
          </h1>
          <p className="text-lg text-muted mt-4 max-w-xl mx-auto">
            We’re always looking for warm, dependable people who love great coffee and
            great service. Find a role and apply in minutes.
          </p>
          {jobs.length > 0 && (
            <a href="#openings" className="btn btn-primary mt-6">
              See open roles
            </a>
          )}
        </section>

        {/* Openings */}
        <section id="openings" className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-xl font-bold text-espresso mb-4">Open positions</h2>
          {jobs.length === 0 ? (
            <div className="card p-10 text-center text-muted">
              No open roles right now. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.slug}`}
                  className="card p-5 flex items-center justify-between hover:border-latte transition-colors group"
                >
                  <div>
                    <h3 className="font-semibold text-espresso text-lg group-hover:text-accent">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted mt-0.5">
                      {EMPLOYMENT_LABEL[job.employmentType]} · {job.location}
                    </p>
                  </div>
                  <span className="btn btn-ghost">Apply →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
