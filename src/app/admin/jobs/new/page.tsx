import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createJobAction } from '../../actions'
import { JobFields } from '@/components/JobFields'

export const metadata = { title: 'New job' }

export default async function NewJobPage() {
  await requireAdmin()
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-muted hover:text-accent">
        ← Back to jobs
      </Link>
      <h1
        className="text-2xl font-bold text-espresso mt-2 mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        New job
      </h1>
      <form action={createJobAction} className="card p-6">
        <JobFields />
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/admin" className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary">
            Create job
          </button>
        </div>
        <p className="text-xs text-muted mt-3">
          Tip: create the job with a good description, then use “Generate with AI” to
          draft screening questions.
        </p>
      </form>
    </div>
  )
}
