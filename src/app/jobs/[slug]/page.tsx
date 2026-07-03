import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PublicHeader, PublicFooter } from '@/components/PublicHeader'
import { EMPLOYMENT_LABEL } from '@/components/ui'
import ApplyForm from './ApplyForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const job = await prisma.job.findUnique({ where: { slug } })
  if (!job) return { title: 'Job not found' }
  return {
    title: job.title,
    description: job.description.slice(0, 155),
  }
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { questions: { orderBy: { order: 'asc' } } },
  })
  if (!job) notFound()

  const closed = job.status !== 'OPEN'

  return (
    <>
      <PublicHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← All roles
        </Link>

        <div className="mt-3 mb-6">
          <h1
            className="text-3xl font-bold text-espresso"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {job.title}
          </h1>
          <p className="text-muted mt-1">
            {EMPLOYMENT_LABEL[job.employmentType]} · {job.location}
          </p>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-espresso mb-2">About the role</h2>
          <p className="text-coffee whitespace-pre-wrap leading-relaxed">
            {job.description || 'No description provided.'}
          </p>
        </div>

        {closed ? (
          <div className="card p-8 text-center">
            <p className="text-espresso font-semibold">
              This role isn’t accepting applications right now.
            </p>
            <Link href="/" className="btn btn-ghost mt-4">
              See other roles
            </Link>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="font-semibold text-espresso text-lg mb-4">
              Apply for this role
            </h2>
            <ApplyForm
              slug={job.slug}
              questions={job.questions.map((q) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.options,
                required: q.required,
              }))}
            />
          </div>
        )}
      </main>
      <PublicFooter />
    </>
  )
}
