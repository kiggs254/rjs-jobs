import { NextResponse, type NextRequest } from 'next/server'
import { uploadResume, isR2Configured } from '@/lib/r2'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB (phone photos of documents can be large)
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

// Simple random id without external deps or Math.random dependence on time.
function randomId() {
  return crypto.randomUUID().replace(/-/g, '')
}

export async function POST(req: NextRequest) {
  if (!isR2Configured()) {
    return jsonNoStore({ error: 'File uploads are not configured.' }, 503)
  }

  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim()
  if (!rateLimit(`upload:${ip}`, 10, 60_000)) {
    return jsonNoStore({ error: 'Too many uploads. Please wait a minute.' }, 429)
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return jsonNoStore({ error: 'Invalid upload.' }, 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return jsonNoStore({ error: 'No file provided.' }, 400)
  }

  const ext = ALLOWED[file.type]
  if (!ext) {
    return jsonNoStore(
      { error: 'Please upload a PDF, Word document, or image (.pdf, .doc, .docx, .png, .jpg, .webp).' },
      415,
    )
  }
  if (file.size === 0) return jsonNoStore({ error: 'The file is empty.' }, 400)
  if (file.size > MAX_BYTES) {
    return jsonNoStore({ error: 'File too large (max 8 MB).' }, 413)
  }

  // 'cv' (default) or 'cover' — determines the storage prefix.
  const kind = String(form.get('kind') ?? 'cv') === 'cover' ? 'covers' : 'cvs'
  const buffer = Buffer.from(await file.arrayBuffer())
  const safeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || `${kind}.${ext}`
  const key = `${kind}/${randomId()}.${ext}`

  try {
    await uploadResume(key, buffer, file.type)
  } catch {
    return jsonNoStore({ error: 'Upload failed. Please try again.' }, 502)
  }

  return jsonNoStore({ key, name: safeName })
}
