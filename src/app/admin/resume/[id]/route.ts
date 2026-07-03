import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getResumeDownloadUrl } from '@/lib/r2'

export const runtime = 'nodejs'

// GET /admin/resume/<applicationId> — admin-only. Redirects to a short-lived
// presigned R2 URL that downloads the applicant's CV. Guarded by proxy.ts,
// re-checked here defence-in-depth.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const app = await prisma.application.findUnique({
    where: { id },
    select: { resumeKey: true, resumeName: true, applicantName: true },
  })
  if (!app || !app.resumeKey) {
    return NextResponse.json({ error: 'No CV on file' }, { status: 404 })
  }

  const filename = app.resumeName || `${app.applicantName}-CV`
  const url = await getResumeDownloadUrl(app.resumeKey, filename)
  return NextResponse.redirect(url)
}
