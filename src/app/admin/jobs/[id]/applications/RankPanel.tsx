'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { rankAction, type RankState } from '../../../applications-actions'

const RECOMMEND_STYLE: Record<string, { bg: string; fg: string }> = {
  SHORTLIST: { bg: '#e6f4ec', fg: 'var(--color-good)' },
  MAYBE: { bg: '#fbf1dd', fg: 'var(--color-warn)' },
  REJECT: { bg: '#fbe9e8', fg: 'var(--color-bad)' },
}

export default function RankPanel({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<RankState, FormData>(
    rankAction,
    {},
  )

  return (
    <div
      className="card p-5"
      style={{ background: 'var(--color-cream-100)', borderColor: 'var(--color-latte)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="font-semibold text-espresso">AI shortlist</h3>
            <p className="text-sm text-muted">
              Rank all graded applicants and get a recommended shortlist.
            </p>
          </div>
        </div>
        <form action={action}>
          <input type="hidden" name="jobId" value={jobId} />
          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Ranking…' : 'Rank candidates'}
          </button>
        </form>
      </div>

      {state.error && (
        <p className="text-sm text-bad mt-3" role="alert">
          {state.error}
        </p>
      )}

      {state.ok && (
        <div className="mt-4 space-y-3">
          {state.summary && (
            <p className="text-sm text-coffee bg-white rounded-lg p-3 border border-line">
              {state.summary}
            </p>
          )}
          <ol className="space-y-2">
            {state.ranking?.map((r) => {
              const s = RECOMMEND_STYLE[r.recommend] ?? {
                bg: '#eee',
                fg: '#666',
              }
              return (
                <li
                  key={r.applicationId}
                  className="bg-white rounded-lg p-3 border border-line flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-espresso w-6 text-center">
                      #{r.rank}
                    </span>
                    <Link
                      href={`/admin/applications/${r.applicationId}`}
                      className="font-medium text-espresso hover:text-accent"
                    >
                      {r.name}
                    </Link>
                    <span className="badge" style={{ background: s.bg, color: s.fg }}>
                      {r.recommend}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted hidden sm:block max-w-md truncate">
                      {r.note}
                    </span>
                    <span className="text-sm font-semibold text-mocha">
                      {r.overallScore ?? '—'}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
