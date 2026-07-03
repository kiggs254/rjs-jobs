'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin, destroySession } from '@/lib/auth'
import { slugify } from '@/lib/slug'
import { generateQuestions } from '@/lib/ai'
import type { JobStatus, EmploymentType, QuestionType } from '@/generated/prisma/enums'

// ── auth ─────────────────────────────────────────────────────────────────
export async function logoutAction() {
  await destroySession()
  redirect('/admin/login')
}

// ── job CRUD ──────────────────────────────────────────────────────────────
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base)
  let candidate = root
  let n = 1
  // Loop until we find a free slug.
  while (true) {
    const existing = await prisma.job.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === ignoreId) return candidate
    n++
    candidate = `${root}-${n}`
  }
}

export async function createJobAction(formData: FormData) {
  await requireAdmin()
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  const slug = await uniqueSlug(title)

  const job = await prisma.job.create({
    data: {
      title,
      slug,
      location: String(formData.get('location') ?? 'Nairobi').trim() || 'Nairobi',
      employmentType: (String(formData.get('employmentType') ?? 'FULL_TIME') as EmploymentType),
      description: String(formData.get('description') ?? '').trim(),
      status: (String(formData.get('status') ?? 'DRAFT') as JobStatus),
    },
  })
  revalidatePath('/admin')
  redirect(`/admin/jobs/${job.id}`)
}

export async function updateJobAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  if (!id || !title) return

  await prisma.job.update({
    where: { id },
    data: {
      title,
      location: String(formData.get('location') ?? 'Nairobi').trim() || 'Nairobi',
      employmentType: (String(formData.get('employmentType') ?? 'FULL_TIME') as EmploymentType),
      description: String(formData.get('description') ?? '').trim(),
      status: (String(formData.get('status') ?? 'DRAFT') as JobStatus),
    },
  })
  revalidatePath('/admin')
  revalidatePath(`/admin/jobs/${id}`)
}

export async function deleteJobAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await prisma.job.delete({ where: { id } })
  revalidatePath('/admin')
  redirect('/admin')
}

// ── questions ──────────────────────────────────────────────────────────────
export async function addQuestionAction(formData: FormData) {
  await requireAdmin()
  const jobId = String(formData.get('jobId') ?? '')
  const text = String(formData.get('text') ?? '').trim()
  if (!jobId || !text) return

  const count = await prisma.question.count({ where: { jobId } })
  const optionsRaw = String(formData.get('options') ?? '')
  const options = optionsRaw
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean)

  await prisma.question.create({
    data: {
      jobId,
      text,
      type: (String(formData.get('type') ?? 'LONG_TEXT') as QuestionType),
      options,
      weight: Math.min(100, Math.max(1, Number(formData.get('weight') ?? 10) || 10)),
      required: formData.get('required') === 'on',
      gradingCriteria: String(formData.get('gradingCriteria') ?? '').trim(),
      order: count,
    },
  })
  revalidatePath(`/admin/jobs/${jobId}`)
}

export async function updateQuestionAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const jobId = String(formData.get('jobId') ?? '')
  const text = String(formData.get('text') ?? '').trim()
  if (!id || !text) return

  const optionsRaw = String(formData.get('options') ?? '')
  const options = optionsRaw
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean)

  await prisma.question.update({
    where: { id },
    data: {
      text,
      type: (String(formData.get('type') ?? 'LONG_TEXT') as QuestionType),
      options,
      weight: Math.min(100, Math.max(1, Number(formData.get('weight') ?? 10) || 10)),
      required: formData.get('required') === 'on',
      gradingCriteria: String(formData.get('gradingCriteria') ?? '').trim(),
    },
  })
  revalidatePath(`/admin/jobs/${jobId}`)
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const jobId = String(formData.get('jobId') ?? '')
  if (!id) return
  await prisma.question.delete({ where: { id } })
  revalidatePath(`/admin/jobs/${jobId}`)
}

// ── AI: generate questions ──────────────────────────────────────────────────
export interface GenerateState {
  ok?: boolean
  error?: string
  added?: number
}

export async function generateQuestionsAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  await requireAdmin()
  const jobId = String(formData.get('jobId') ?? '')
  const count = Math.min(12, Math.max(1, Number(formData.get('count') ?? 5) || 5))
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) return { error: 'Job not found.' }
  if (!job.description.trim())
    return { error: 'Add a job description first so the AI has context.' }

  try {
    const generated = await generateQuestions({
      title: job.title,
      description: job.description,
      count,
    })
    const start = await prisma.question.count({ where: { jobId } })
    await prisma.$transaction(
      generated.map((q, i) =>
        prisma.question.create({
          data: {
            jobId,
            text: q.text,
            type: q.type,
            options: q.type === 'MULTIPLE_CHOICE' ? q.options : [],
            weight: q.weight,
            gradingCriteria: q.gradingCriteria,
            required: true,
            order: start + i,
          },
        }),
      ),
    )
    revalidatePath(`/admin/jobs/${jobId}`)
    return { ok: true, added: generated.length }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Generation failed.' }
  }
}
