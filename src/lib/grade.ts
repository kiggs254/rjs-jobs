import { prisma } from '@/lib/db'
import { gradeApplication } from '@/lib/ai'

// Grade one application with DeepSeek and persist the results.
// Failure-quiet: on any error the application is left ungraded with gradeError set,
// so the applicant flow never blocks and an admin can re-grade later.
export async function gradeApplicationById(applicationId: string): Promise<void> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      answers: { include: { question: true } },
    },
  })
  if (!app) return

  try {
    const result = await gradeApplication({
      jobTitle: app.job.title,
      jobDescription: app.job.description,
      applicantName: app.applicantName,
      answers: app.answers.map((a) => ({
        questionId: a.questionId,
        questionText: a.question.text,
        type: a.question.type,
        weight: a.question.weight,
        gradingCriteria: a.question.gradingCriteria,
        answer: a.value,
      })),
    })

    const byQuestion = new Map(
      result.answers.map((r) => [r.questionId, r]),
    )

    await prisma.$transaction([
      ...app.answers.map((a) => {
        const g = byQuestion.get(a.questionId)
        return prisma.answer.update({
          where: { id: a.id },
          data: {
            score: g?.score ?? null,
            reasoning: g?.reasoning ?? '',
          },
        })
      }),
      prisma.application.update({
        where: { id: app.id },
        data: {
          overallScore: result.overallScore,
          aiSummary: result.summary,
          aiStrengths: result.strengths,
          aiConcerns: result.concerns,
          graded: true,
          gradeError: '',
          status: 'GRADED',
        },
      }),
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Grading failed'
    await prisma.application.update({
      where: { id: app.id },
      data: { graded: false, gradeError: message },
    })
  }
}
