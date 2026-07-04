'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { gradeApplicationById } from '@/lib/grade'
import { rankCandidates } from '@/lib/ai'
import type { ApplicationStatus } from '@/generated/prisma/enums'

export async function regradeAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const jobId = String(formData.get('jobId') ?? '')
  if (!id) return
  await gradeApplicationById(id)
  revalidatePath(`/admin/jobs/${jobId}/applications`)
  revalidatePath(`/admin/applications/${id}`)
}

export async function setApplicationStatusAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const jobId = String(formData.get('jobId') ?? '')
  const status = String(formData.get('status') ?? '') as ApplicationStatus
  if (!id || !status) return
  await prisma.application.update({ where: { id }, data: { status } })
  revalidatePath(`/admin/jobs/${jobId}/applications`)
  revalidatePath(`/admin/applications/${id}`)
}

export interface RankState {
  ok?: boolean
  error?: string
  summary?: string
  ranking?: {
    applicationId: string
    name: string
    rank: number
    recommend: string
    note: string
    overallScore: number | null
  }[]
}

export async function rankAction(
  _prev: RankState,
  formData: FormData,
): Promise<RankState> {
  await requireAdmin()
  const jobId = String(formData.get('jobId') ?? '')
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { applications: true },
  })
  if (!job) return { error: 'Job not found.' }

  const graded = job.applications.filter((a) => a.graded)
  if (graded.length < 2)
    return { error: 'Need at least 2 graded applications to rank.' }

  try {
    const result = await rankCandidates({
      jobTitle: job.title,
      jobDescription: job.description,
      candidates: graded.map((a) => ({
        applicationId: a.id,
        name: a.applicantName,
        overallScore: a.overallScore,
        summary: a.aiSummary,
        strengths: a.aiStrengths,
        concerns: a.aiConcerns,
        // Only the typed cover letter is machine-readable; uploaded files/images are not.
        coverLetter: a.coverNote,
      })),
    })

    const nameById = new Map(graded.map((a) => [a.id, a.applicantName]))
    const scoreById = new Map(graded.map((a) => [a.id, a.overallScore]))

    const ranking = result.ranking
      .filter((r) => nameById.has(r.applicationId))
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({
        applicationId: r.applicationId,
        name: nameById.get(r.applicationId) ?? 'Unknown',
        rank: r.rank,
        recommend: r.recommend,
        note: r.note,
        overallScore: scoreById.get(r.applicationId) ?? null,
      }))

    return { ok: true, summary: result.summary, ranking }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Ranking failed.' }
  }
}
