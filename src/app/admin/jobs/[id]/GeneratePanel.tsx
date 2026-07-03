'use client'

import { useActionState } from 'react'
import {
  generateQuestionsAction,
  type GenerateState,
} from '../../actions'

export default function GeneratePanel({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<GenerateState, FormData>(
    generateQuestionsAction,
    {},
  )

  return (
    <div
      className="card p-5"
      style={{ background: 'var(--color-cream-100)', borderColor: 'var(--color-latte)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-espresso">Generate questions with AI</h3>
          <p className="text-sm text-muted">
            DeepSeek reads the job description and drafts tailored screening questions,
            each with a grading rubric. Review and edit them below.
          </p>

          <form action={action} className="flex flex-wrap items-end gap-3 mt-3">
            <input type="hidden" name="jobId" value={jobId} />
            <div className="space-y-1">
              <label className="label text-xs" htmlFor="count">
                How many
              </label>
              <input
                id="count"
                name="count"
                type="number"
                min={1}
                max={12}
                defaultValue={5}
                className="input"
                style={{ width: '5rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Generating…' : 'Generate'}
            </button>
          </form>

          {state.error && (
            <p className="text-sm text-bad mt-2" role="alert">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="text-sm text-good mt-2">
              Added {state.added} question{state.added === 1 ? '' : 's'}. Review them
              below.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
