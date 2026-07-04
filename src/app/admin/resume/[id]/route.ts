import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getResumeDownloadUrl } from '@/lib/r2'

export const runtime = 'nodejs'

// GET /admin/resume/<applicationId>?kind=cv|cover — admin-only. Redirects to a
// short-lived presigned R2 URL that downloads the applicant's CV (default) or
// uploaded cover letter. Guarded by proxy.ts, re-checked here defence-in-depth.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const kind = req.nextUrl.searchParams.get('kind') === 'cover' ? 'cover' : 'cv'

  const app = await prisma.application.findUnique({
    where: { id },
    select: {
      resumeKey: true,
      resumeName: true,
      coverLetterKey: true,
      coverLetterName: true,
      applicantName: true,
    },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const key = kind === 'cover' ? app.coverLetterKey : app.resumeKey
  const name =
    (kind === 'cover' ? app.coverLetterName : app.resumeName) ||
    `${app.applicantName}-${kind === 'cover' ? 'cover-letter' : 'CV'}`

  if (!key) {
    return NextResponse.json({ error: 'No file on record' }, { status: 404 })
  }

  const url = await getResumeDownloadUrl(key, name)
  return NextResponse.redirect(url)
}
