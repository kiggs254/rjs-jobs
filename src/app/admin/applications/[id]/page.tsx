import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import {
  regradeAction,
  setApplicationStatusAction,
} from '../../applications-actions'
import { ScoreBadge, StatusBadge, fmtDate, QUESTION_TYPE_LABEL } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      job: true,
      answers: { include: { question: true }, orderBy: { question: { order: 'asc' } } },
    },
  })
  if (!app) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/admin/jobs/${app.jobId}/applications`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Back to applicants
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-espresso"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {app.applicantName}
            </h1>
            <p className="text-muted text-sm">
              Applied for {app.job.title} · {fmtDate(app.createdAt)}
            </p>
            <p className="text-sm text-coffee mt-1">
              <a href={`mailto:${app.email}`} className="hover:text-accent">
                {app.email}
              </a>{' '}
              · {app.phone}
            </p>
            {app.resumeKey ? (
              <a
                href={`/admin/resume/${app.id}`}
                className="btn btn-dark mt-3"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Download CV{app.resumeName ? ` (${app.resumeName})` : ''}
              </a>
            ) : (
              <p className="text-xs text-muted mt-2">No CV uploaded.</p>
            )}
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-muted text-sm">Overall</span>
              <ScoreBadge score={app.overallScore} />
            </div>
            <StatusBadge status={app.status} />
          </div>
        </div>
      </div>

      {/* Status controls */}
      <div className="card p-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted mr-2">Set status:</span>
        {(['SHORTLISTED', 'REJECTED', 'GRADED', 'NEW'] as const).map((s) => (
          <form key={s} action={setApplicationStatusAction}>
            <input type="hidden" name="id" value={app.id} />
            <input type="hidden" name="jobId" value={app.jobId} />
            <input type="hidden" name="status" value={s} />
            <button
              className="btn btn-ghost"
              style={{
                padding: '0.35rem 0.7rem',
                borderColor:
                  app.status === s ? 'var(--color-accent)' : 'var(--color-line)',
              }}
              disabled={app.status === s}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          </form>
        ))}
        <div className="ml-auto">
          <form action={regradeAction}>
            <input type="hidden" name="id" value={app.id} />
            <input type="hidden" name="jobId" value={app.jobId} />
            <button className="btn btn-ghost" style={{ padding: '0.35rem 0.7rem' }}>
              ↻ Re-grade
            </button>
          </form>
        </div>
      </div>

      {/* AI verdict */}
      {app.graded ? (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-espresso">AI assessment</h2>
          {app.aiSummary && <p className="text-coffee">{app.aiSummary}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-good mb-1">Strengths</div>
              {app.aiStrengths.length ? (
                <ul className="list-disc pl-5 text-sm text-coffee space-y-0.5">
                  {app.aiStrengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">—</p>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-bad mb-1">Concerns</div>
              {app.aiConcerns.length ? (
                <ul className="list-disc pl-5 text-sm text-coffee space-y-0.5">
                  {app.aiConcerns.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">—</p>
              )}
            </div>
          </div>
        </div>
      ) : app.gradeError ? (
        <div className="card p-5" style={{ borderColor: 'var(--color-bad)' }}>
          <p className="text-sm text-bad">
            Grading failed: {app.gradeError}. Check your DeepSeek key, then Re-grade.
          </p>
        </div>
      ) : (
        <div className="card p-5 text-muted text-sm">Not graded yet.</div>
      )}

      {app.coverNote && (
        <div className="card p-5">
          <h2 className="font-semibold text-espresso mb-1">Cover note</h2>
          <p className="text-coffee whitespace-pre-wrap">{app.coverNote}</p>
        </div>
      )}

      {/* Answers */}
      <div className="space-y-3">
        <h2 className="font-semibold text-espresso text-lg">Answers</h2>
        {app.answers.map((a, i) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-espresso">
                {i + 1}. {a.question.text}
              </p>
              <div className="shrink-0">
                <ScoreBadge score={a.score} />
              </div>
            </div>
            <div className="text-xs text-muted mt-0.5">
              {QUESTION_TYPE_LABEL[a.question.type]} · weight {a.question.weight}
            </div>
            <p className="text-coffee mt-2 whitespace-pre-wrap">
              {a.value || <span className="text-muted italic">(blank)</span>}
            </p>
            {a.reasoning && (
              <p className="text-sm text-muted mt-2 border-t border-line pt-2">
                <span className="font-semibold">AI:</span> {a.reasoning}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
