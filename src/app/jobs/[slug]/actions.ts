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
  const resumeKey = String(formData.get('resumeKey') ?? '').trim()
  const resumeName = String(formData.get('resumeName') ?? '').trim()
  const coverLetterKey = String(formData.get('coverLetterKey') ?? '').trim()
  const coverLetterName = String(formData.get('coverLetterName') ?? '').trim()

  // Keys must look like ones our upload route issued (prefix + hash + allowed ext).
  const CV_KEY_RE = /^cvs\/[a-f0-9]+\.(pdf|doc|docx|png|jpg|webp)$/
  const COVER_KEY_RE = /^covers\/[a-f0-9]+\.(pdf|doc|docx|png|jpg|webp)$/

  if (!applicantName) return { error: 'Please enter your name.' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address.' }
  if (!phone) return { error: 'Please enter your phone number.' }
  if (!resumeKey || !CV_KEY_RE.test(resumeKey)) {
    return { error: 'Please upload your CV before submitting.' }
  }
  if (coverLetterKey && !COVER_KEY_RE.test(coverLetterKey)) {
    return { error: 'Your cover letter upload was invalid. Please re-upload it.' }
  }

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
      resumeKey,
      resumeName,
      coverLetterKey,
      coverLetterName,
      status: 'NEW',
      answers: { create: answers },
    },
  })

  // Grade with DeepSeek. Failure-quiet: never blocks the applicant.
  await gradeApplicationById(application.id)

  redirect(`/jobs/${slug}/thanks`)
}
