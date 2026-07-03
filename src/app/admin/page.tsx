import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { StatusBadge, EMPLOYMENT_LABEL, fmtDate } from '@/components/ui'

export const metadata = { title: 'Jobs' }
export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  await requireAdmin()
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { applications: true, questions: true } },
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-espresso"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Jobs
          </h1>
          <p className="text-muted text-sm">
            Post roles, generate screening questions, and review graded applicants.
          </p>
        </div>
        <Link href="/admin/jobs/new" className="btn btn-primary">
          + New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No jobs yet. Create your first one to start receiving applications.
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/admin/jobs/${job.id}`}
              className="card p-4 flex items-center justify-between hover:border-latte transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-espresso">{job.title}</span>
                  <StatusBadge status={job.status} />
                </div>
                <div className="text-sm text-muted mt-0.5">
                  {EMPLOYMENT_LABEL[job.employmentType]} · {job.location} · created{' '}
                  {fmtDate(job.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-espresso">
                    {job._count.questions}
                  </div>
                  <div className="text-muted text-xs">questions</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-espresso">
                    {job._count.applications}
                  </div>
                  <div className="text-muted text-xs">applicants</div>
                </div>
                <span className="text-accent">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
