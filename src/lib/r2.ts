import 'server-only'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 is S3-compatible. Endpoint: https://<accountId>.r2.cloudflarestorage.com
function bucket() {
  const b = process.env.R2_BUCKET
  if (!b) throw new Error('R2_BUCKET is not set')
  return b
}

let _client: S3Client | null = null
function client(): S3Client {
  if (_client) return _client
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not fully set (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)')
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return _client
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  )
}

export async function uploadResume(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

// Presigned GET URL so an admin can download a private CV. Default 5 min.
export async function getResumeDownloadUrl(
  key: string,
  filename?: string,
  expiresIn = 300,
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
    ...(filename
      ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"` }
      : {}),
  })
  return getSignedUrl(client(), cmd, { expiresIn })
}
