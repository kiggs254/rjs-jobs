import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { regradeAction } from '../../../applications-actions'
import { ScoreBadge, StatusBadge, fmtDate } from '@/components/ui'
import RankPanel from './RankPanel'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: [{ overallScore: 'desc' }, { createdAt: 'desc' }],
      },
    },
  })
  if (!job) notFound()

  const apps = job.applications

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/admin/jobs/${job.id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Back to job
        </Link>
        <h1
          className="text-2xl font-bold text-espresso mt-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Applicants · {job.title}
        </h1>
        <p className="text-muted text-sm">
          {apps.length} application{apps.length === 1 ? '' : 's'}, sorted by AI score.
        </p>
      </div>

      {apps.length >= 2 && <RankPanel jobId={job.id} />}

      {apps.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No applications yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="p-3 font-medium">Applicant</th>
                <th className="p-3 font-medium">Score</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium hidden md:table-cell">Applied</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="font-medium text-espresso hover:text-accent"
                    >
                      {a.applicantName}
                    </Link>
                    <div className="text-muted text-xs">{a.email}</div>
                  </td>
                  <td className="p-3">
                    {a.graded ? (
                      <ScoreBadge score={a.overallScore} />
                    ) : a.gradeError ? (
                      <span className="text-xs text-bad">grading failed</span>
                    ) : (
                      <span className="text-xs text-muted">pending…</span>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-3 text-muted hidden md:table-cell">
                    {fmtDate(a.createdAt)}
                  </td>
                  <td className="p-3 text-right">
                    {!a.graded && (
                      <form action={regradeAction} className="inline">
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="jobId" value={job.id} />
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0.3rem 0.6rem' }}
                        >
                          Grade
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
