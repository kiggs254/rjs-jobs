import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { updateJobAction, deleteJobAction } from '../../actions'
import { JobFields } from '@/components/JobFields'
import { StatusBadge } from '@/components/ui'
import GeneratePanel from './GeneratePanel'
import QuestionsManager from './QuestionsManager'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: 'asc' } },
      _count: { select: { applications: true } },
    },
  })
  if (!job) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-accent">
          ← Back to jobs
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-espresso"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {job.title}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/jobs/${job.id}/applications`}
              className="btn btn-ghost"
            >
              Applicants ({job._count.applications})
            </Link>
            {job.status === 'OPEN' && (
              <Link
                href={`/jobs/${job.slug}`}
                target="_blank"
                className="btn btn-ghost"
              >
                View public ↗
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Edit job */}
      <section className="card p-6">
        <h2 className="font-semibold text-espresso text-lg mb-4">Job details</h2>
        <form action={updateJobAction} className="space-y-4">
          <input type="hidden" name="id" value={job.id} />
          <JobFields job={job} />
          <div className="flex justify-between items-center">
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--color-bad)' }}
              formAction={deleteJobAction}
            >
              Delete job
            </button>
            <button type="submit" className="btn btn-primary" formAction={updateJobAction}>
              Save details
            </button>
          </div>
        </form>
      </section>

      {/* AI generate */}
      <GeneratePanel jobId={job.id} />

      {/* Questions */}
      <QuestionsManager
        jobId={job.id}
        questions={job.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          weight: q.weight,
          required: q.required,
          gradingCriteria: q.gradingCriteria,
        }))}
      />
    </div>
  )
}
