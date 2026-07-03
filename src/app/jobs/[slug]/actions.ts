'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { gradeApplicationById } from '@/lib/grade'

export interface ApplyState {
  error?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function applyAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const slug = String(formData.get('slug') ?? '')
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { questions: { orderBy: { order: 'asc' } } },
  })
  if (!job || job.status !== 'OPEN') {
    return { error: 'This job is no longer accepting applications.' }
  }

  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? 'local').split(',')[0].trim()
  if (!rateLimit(`apply:${ip}`, 5, 60_000)) {
    return { error: 'Too many submissions. Please wait a minute and try again.' }
  }

  const applicantName = String(formData.get('applicantName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const phone = String(formData.get('phone') ?? '').trim()
  const coverNote = String(formData.get('coverNote') ?? '').trim()

  if (!applicantName) return { error: 'Please enter your name.' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address.' }
  if (!phone) return { error: 'Please enter your phone number.' }

  // Collect + validate answers.
  const answers: { questionId: string; value: string }[] = []
  for (const q of job.questions) {
    const value = String(formData.get(`q_${q.id}`) ?? '').trim()
    if (q.required && !value) {
      return { error: `Please answer: “${q.text}”` }
    }
    answers.push({ questionId: q.id, value })
  }

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      applicantName,
      email,
      phone,
      coverNote,
      status: 'NEW',
      answers: { create: answers },
    },
  })

  // Grade with DeepSeek. Failure-quiet: never blocks the applicant.
  await gradeApplicationById(application.id)

  redirect(`/jobs/${slug}/thanks`)
}
