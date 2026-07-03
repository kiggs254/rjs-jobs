'use client'

import { useState } from 'react'
import QuestionForm from './QuestionForm'
import { deleteQuestionAction } from '../../actions'
import { QUESTION_TYPE_LABEL } from '@/components/ui'

type Q = {
  id: string
  text: string
  type: string
  options: string[]
  weight: number
  required: boolean
  gradingCriteria: string
}

export default function QuestionsManager({
  jobId,
  questions,
}: {
  jobId: string
  questions: Q[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-espresso text-lg">
          Screening questions{' '}
          <span className="text-muted font-normal text-sm">
            ({questions.length})
          </span>
        </h2>
        {!adding && (
          <button className="btn btn-ghost" onClick={() => setAdding(true)}>
            + Add manually
          </button>
        )}
      </div>

      {adding && (
        <div className="card p-5">
          <QuestionForm jobId={jobId} onDone={() => setAdding(false)} />
        </div>
      )}

      {questions.length === 0 && !adding && (
        <div className="card p-6 text-center text-muted text-sm">
          No questions yet. Generate some with AI above, or add one manually.
        </div>
      )}

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="card p-4">
            {editingId === q.id ? (
              <QuestionForm
                jobId={jobId}
                question={q}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge" style={{ background: '#efe6da', color: 'var(--color-mocha)' }}>
                      {QUESTION_TYPE_LABEL[q.type]}
                    </span>
                    <span className="badge" style={{ background: '#efe6da', color: 'var(--color-mocha)' }}>
                      weight {q.weight}
                    </span>
                    {!q.required && (
                      <span className="text-xs text-muted">optional</span>
                    )}
                  </div>
                  <p className="text-espresso font-medium">
                    {i + 1}. {q.text}
                  </p>
                  {q.options.length > 0 && (
                    <p className="text-sm text-muted mt-1">
                      Options: {q.options.join(' · ')}
                    </p>
                  )}
                  {q.gradingCriteria && (
                    <p className="text-sm text-muted mt-1">
                      <span className="font-semibold">Rubric:</span>{' '}
                      {q.gradingCriteria}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.6rem' }}
                    onClick={() => setEditingId(q.id)}
                  >
                    Edit
                  </button>
                  <form action={deleteQuestionAction}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="jobId" value={jobId} />
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.6rem', color: 'var(--color-bad)' }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
