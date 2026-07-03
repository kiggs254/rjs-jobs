export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null)
    return (
      <span className="badge" style={{ background: '#eee', color: '#666' }}>
        —
      </span>
    )
  const { bg, fg } =
    score >= 75
      ? { bg: '#e6f4ec', fg: 'var(--color-good)' }
      : score >= 50
        ? { bg: '#fbf1dd', fg: 'var(--color-warn)' }
        : { bg: '#fbe9e8', fg: 'var(--color-bad)' }
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {score}/100
    </span>
  )
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  DRAFT: { bg: '#eee', fg: '#666', label: 'Draft' },
  OPEN: { bg: '#e6f4ec', fg: 'var(--color-good)', label: 'Open' },
  CLOSED: { bg: '#f1e7e1', fg: 'var(--color-mocha)', label: 'Closed' },
  NEW: { bg: '#e8eefb', fg: '#3557b7', label: 'New' },
  GRADED: { bg: '#f1e7fb', fg: '#7b3fb0', label: 'Graded' },
  SHORTLISTED: { bg: '#e6f4ec', fg: 'var(--color-good)', label: 'Shortlisted' },
  REJECTED: { bg: '#fbe9e8', fg: 'var(--color-bad)', label: 'Rejected' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#eee', fg: '#666', label: status }
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

export function fmtDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const EMPLOYMENT_LABEL: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CASUAL: 'Casual',
  INTERNSHIP: 'Internship',
}

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  SHORT_TEXT: 'Short text',
  LONG_TEXT: 'Long text',
  MULTIPLE_CHOICE: 'Multiple choice',
  NUMBER: 'Number',
}

