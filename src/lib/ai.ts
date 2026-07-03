import OpenAI from 'openai'
import { z } from 'zod'

// DeepSeek is OpenAI-compatible. We point the OpenAI SDK at their base URL.
function client() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new AiError('DEEPSEEK_API_KEY is not set')
  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  })
}

const MODEL = () => process.env.DEEPSEEK_MODEL || 'deepseek-chat'

export class AiError extends Error {}

// Call DeepSeek in JSON mode and parse the response against a schema.
async function chatJSON<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  maxTokens = 4000,
): Promise<T> {
  const res = await client().chat.completions.create({
    model: MODEL(),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: maxTokens,
  })

  const content = res.choices[0]?.message?.content
  if (!content) throw new AiError('Empty response from DeepSeek')

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new AiError('DeepSeek returned invalid JSON')
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new AiError(
      `DeepSeek response failed validation: ${result.error.issues
        .map((i) => i.path.join('.') + ' ' + i.message)
        .join('; ')}`,
    )
  }
  return result.data
}

// ── 1) Generate tailored screening questions from a job ──────────────────

const GeneratedQuestion = z.object({
  text: z.string().min(3),
  type: z.enum(['SHORT_TEXT', 'LONG_TEXT', 'MULTIPLE_CHOICE', 'NUMBER']),
  options: z.array(z.string()).default([]),
  weight: z.number().int().min(1).max(100).default(10),
  gradingCriteria: z.string().default(''),
})
export type GeneratedQuestion = z.infer<typeof GeneratedQuestion>

const GenerateResult = z.object({
  questions: z.array(GeneratedQuestion).min(1).max(12),
})

export async function generateQuestions(input: {
  title: string
  description: string
  count?: number
}): Promise<GeneratedQuestion[]> {
  const count = input.count ?? 5
  const system = `You are a hiring assistant for RJS Coffee Shop, a café in Kenya.
Given a job posting, produce ${count} tailored screening questions that reveal whether a candidate is a good fit.
Mix question types. Prefer LONG_TEXT for judgment/experience questions, MULTIPLE_CHOICE for availability/preferences, NUMBER for years-of-experience style questions.
For EVERY question, write a concise "gradingCriteria" rubric describing what a strong vs weak answer looks like — this will be used to auto-grade applicants.
Assign a "weight" (1-100) reflecting how important the question is to the role; weights need not sum to 100.
For MULTIPLE_CHOICE, provide 3-6 "options"; for other types leave "options" empty.
Respond ONLY as JSON of the form:
{"questions":[{"text":"...","type":"LONG_TEXT","options":[],"weight":30,"gradingCriteria":"..."}]}`

  const user = `Job title: ${input.title}\n\nJob description:\n${input.description}`

  const out = await chatJSON(system, user, GenerateResult, 4000)
  return out.questions.slice(0, Math.max(1, count))
}

// ── 2) Auto-grade an application against its questions ───────────────────

const PerAnswerGrade = z.object({
  questionId: z.string(),
  score: z.number().int().min(0).max(100),
  reasoning: z.string().default(''),
})

const GradeResult = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string().default(''),
  strengths: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  answers: z.array(PerAnswerGrade).default([]),
})
export type GradeResult = z.infer<typeof GradeResult>

export interface GradeInput {
  jobTitle: string
  jobDescription: string
  applicantName: string
  answers: {
    questionId: string
    questionText: string
    type: string
    weight: number
    gradingCriteria: string
    answer: string
  }[]
}

export async function gradeApplication(input: GradeInput): Promise<GradeResult> {
  const system = `You are a strict but fair hiring evaluator for RJS Coffee Shop.
Grade the candidate's answers against each question's grading criteria and the job.
Score each answer 0-100. Then compute an "overallScore" (0-100) as the WEIGHTED average using each question's weight.
Be concrete and evidence-based in "reasoning". Keep "summary" to 1-2 sentences.
Provide up to 3 "strengths" and up to 3 "concerns" as short bullet strings.
You MUST return one entry in "answers" for every question, using the exact provided questionId.
Respond ONLY as JSON:
{"overallScore":72,"summary":"...","strengths":["..."],"concerns":["..."],"answers":[{"questionId":"...","score":80,"reasoning":"..."}]}`

  const questionsBlock = input.answers
    .map(
      (a, i) =>
        `Q${i + 1} [id=${a.questionId}] (weight ${a.weight}, type ${a.type})\n` +
        `Question: ${a.questionText}\n` +
        `Grading criteria: ${a.gradingCriteria || '(none provided — judge reasonableness)'}\n` +
        `Candidate answer: ${a.answer || '(left blank)'}\n`,
    )
    .join('\n')

  const user = `Job title: ${input.jobTitle}\nJob description:\n${input.jobDescription}\n\nCandidate: ${input.applicantName}\n\n${questionsBlock}`

  return chatJSON(system, user, GradeResult, 4000)
}

// ── 3) Rank / shortlist candidates for a job ─────────────────────────────

const RankResult = z.object({
  ranking: z
    .array(
      z.object({
        applicationId: z.string(),
        rank: z.number().int().min(1),
        recommend: z.enum(['SHORTLIST', 'MAYBE', 'REJECT']),
        note: z.string().default(''),
      }),
    )
    .default([]),
  summary: z.string().default(''),
})
export type RankResult = z.infer<typeof RankResult>

export interface RankInput {
  jobTitle: string
  jobDescription: string
  candidates: {
    applicationId: string
    name: string
    overallScore: number | null
    summary: string
    strengths: string[]
    concerns: string[]
  }[]
}

export async function rankCandidates(input: RankInput): Promise<RankResult> {
  const system = `You are a hiring manager for RJS Coffee Shop.
Given graded candidates for a role, rank them best-to-worst (rank 1 = best).
For each, set "recommend" to SHORTLIST, MAYBE, or REJECT, with a one-line "note".
Write a short overall "summary" naming your top pick(s) and why.
Use the exact provided applicationId values.
Respond ONLY as JSON:
{"ranking":[{"applicationId":"...","rank":1,"recommend":"SHORTLIST","note":"..."}],"summary":"..."}`

  const block = input.candidates
    .map(
      (c) =>
        `id=${c.applicationId} | ${c.name} | score=${c.overallScore ?? 'n/a'}\n` +
        `summary: ${c.summary}\n` +
        `strengths: ${c.strengths.join('; ') || 'none'}\n` +
        `concerns: ${c.concerns.join('; ') || 'none'}\n`,
    )
    .join('\n')

  const user = `Job title: ${input.jobTitle}\nJob description:\n${input.jobDescription}\n\nCandidates:\n${block}`

  return chatJSON(system, user, RankResult, 4000)
}
