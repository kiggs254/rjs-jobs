'use client'

import { useActionState } from 'react'
import { applyAction, type ApplyState } from './actions'

type Q = {
  id: string
  text: string
  type: string
  options: string[]
  required: boolean
}

export default function ApplyForm({
  slug,
  questions,
}: {
  slug: string
  questions: Q[]
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    applyAction,
    {},
  )

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="label" htmlFor="applicantName">
            Full name *
          </label>
          <input id="applicantName" name="applicantName" required className="input" />
        </div>
        <div className="space-y-1.5">
          <label className="label" htmlFor="phone">
            Phone *
          </label>
          <input
            id="phone"
            name="phone"
            required
            className="input"
            placeholder="07xx xxx xxx"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="label" htmlFor="email">
          Email *
        </label>
        <input id="email" name="email" type="email" required className="input" />
      </div>

      {questions.length > 0 && (
        <div className="border-t border-line pt-5 space-y-5">
          <h3 className="font-semibold text-espresso">A few questions</h3>
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-1.5">
              <label className="label" htmlFor={`q_${q.id}`}>
                {i + 1}. {q.text} {q.required && '*'}
              </label>
              <QuestionInput q={q} />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="label" htmlFor="coverNote">
          Anything else you’d like us to know?
        </label>
        <textarea id="coverNote" name="coverNote" rows={3} className="textarea" />
      </div>

      {state.error && (
        <p className="text-sm text-bad" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit application'}
      </button>
      <p className="text-xs text-muted text-center">
        By applying you consent to RJS Coffee Shop reviewing your responses.
      </p>
    </form>
  )
}

function QuestionInput({ q }: { q: Q }) {
  const name = `q_${q.id}`
  if (q.type === 'MULTIPLE_CHOICE') {
    return (
      <select id={name} name={name} required={q.required} className="select">
        <option value="">Select…</option>
        {q.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }
  if (q.type === 'NUMBER') {
    return (
      <input
        id={name}
        name={name}
        type="number"
        required={q.required}
        className="input"
      />
    )
  }
  if (q.type === 'SHORT_TEXT') {
    return <input id={name} name={name} required={q.required} className="input" />
  }
  return (
    <textarea id={name} name={name} rows={4} required={q.required} className="textarea" />
  )
}
