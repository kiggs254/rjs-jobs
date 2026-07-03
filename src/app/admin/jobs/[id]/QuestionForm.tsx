'use client'

import { useState } from 'react'
import { addQuestionAction, updateQuestionAction } from '../../actions'
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

export default function QuestionForm({
  jobId,
  question,
  onDone,
}: {
  jobId: string
  question?: Q
  onDone?: () => void
}) {
  const editing = !!question
  const [type, setType] = useState(question?.type ?? 'LONG_TEXT')

  return (
    <form
      action={editing ? updateQuestionAction : addQuestionAction}
      onSubmit={() => onDone?.()}
      className="grid gap-3"
    >
      <input type="hidden" name="jobId" value={jobId} />
      {editing && <input type="hidden" name="id" value={question!.id} />}

      <div className="space-y-1.5">
        <label className="label">Question</label>
        <textarea
          name="text"
          required
          rows={2}
          defaultValue={question?.text ?? ''}
          className="textarea"
          placeholder="What do you want to ask applicants?"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="label">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="select"
          >
            {Object.entries(QUESTION_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="label">Weight (1–100)</label>
          <input
            name="weight"
            type="number"
            min={1}
            max={100}
            defaultValue={question?.weight ?? 10}
            className="input"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-coffee">
            <input
              type="checkbox"
              name="required"
              defaultChecked={question?.required ?? true}
            />
            Required
          </label>
        </div>
      </div>

      {type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-1.5">
          <label className="label">Options (one per line)</label>
          <textarea
            name="options"
            rows={4}
            defaultValue={question?.options.join('\n') ?? ''}
            className="textarea"
            placeholder={'Mornings\nAfternoons\nEvenings\nAny'}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="label">
          Grading criteria{' '}
          <span className="text-muted font-normal">
            — what a strong answer looks like (used by the AI)
          </span>
        </label>
        <textarea
          name="gradingCriteria"
          rows={2}
          defaultValue={question?.gradingCriteria ?? ''}
          className="textarea"
          placeholder="e.g. Strong answers show hands-on espresso experience and empathy for customers."
        />
      </div>

      <div className="flex justify-end gap-2">
        {onDone && (
          <button type="button" className="btn btn-ghost" onClick={onDone}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {editing ? 'Save changes' : 'Add question'}
        </button>
      </div>
    </form>
  )
}
