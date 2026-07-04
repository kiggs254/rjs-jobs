'use client'

import { useActionState, useMemo, useRef, useState } from 'react'
import { applyAction, type ApplyState } from './actions'

type Q = {
  id: string
  text: string
  type: string
  options: string[]
  required: boolean
}

type Cv = { key: string; name: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // Collected data (lives in state; mirrored into hidden inputs for submission).
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverNote, setCoverNote] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [cv, setCv] = useState<Cv | null>(null)

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  // Build the ordered list of steps.
  const steps = useMemo(
    () => [
      { id: 'about', title: 'About you' },
      { id: 'cv', title: 'Your CV' },
      ...questions.map((q, i) => ({ id: q.id, title: `Question ${i + 1}`, q })),
      { id: 'review', title: 'Review & submit' },
    ],
    [questions],
  )
  const last = steps.length - 1
  const pct = Math.round((step / last) * 100)
  const current = steps[step]

  function setAnswer(id: string, v: string) {
    setAnswers((a) => ({ ...a, [id]: v }))
  }

  function validateStep(i: number): string {
    const s = steps[i]
    if (s.id === 'about') {
      if (!name.trim()) return 'Please enter your name.'
      if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.'
      if (!phone.trim()) return 'Please enter your phone number.'
    } else if (s.id === 'cv') {
      if (!cv) return 'Please upload your CV to continue.'
    } else if ('q' in s && s.q) {
      const q = s.q as Q
      if (q.required && !(answers[q.id] ?? '').trim())
        return 'Please answer this question.'
    }
    return ''
  }

  function next() {
    const err = validateStep(step)
    if (err) return setError(err)
    setError('')
    setStep((v) => Math.min(last, v + 1))
  }
  function back() {
    setError('')
    setStep((v) => Math.max(0, v - 1))
  }

  return (
    <form action={action}>
      {/* Hidden inputs carry all submitted data regardless of current step */}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="applicantName" value={name} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="coverNote" value={coverNote} />
      <input type="hidden" name="resumeKey" value={cv?.key ?? ''} />
      <input type="hidden" name="resumeName" value={cv?.name ?? ''} />
      {questions.map((q) => (
        <input key={q.id} type="hidden" name={`q_${q.id}`} value={answers[q.id] ?? ''} />
      ))}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted mb-2">
          <span>{current.title}</span>
          <span>
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-line overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: 'var(--color-brand-red)' }}
          />
        </div>
      </div>

      {/* Step body */}
      <div className="min-h-[220px]">
        {current.id === 'about' && (
          <div className="grid gap-4">
            <Field label="Full name *">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone *">
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07xx xxx xxx"
                />
              </Field>
              <Field label="Email *">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {current.id === 'cv' && (
          <CvUpload cv={cv} onChange={setCv} onError={setError} />
        )}

        {'q' in current && current.q && (
          <QuestionStep
            q={current.q as Q}
            value={answers[(current.q as Q).id] ?? ''}
            onChange={(v) => setAnswer((current.q as Q).id, v)}
          />
        )}

        {current.id === 'review' && (
          <Review
            name={name}
            email={email}
            phone={phone}
            coverNote={coverNote}
            setCoverNote={setCoverNote}
            cv={cv}
            questions={questions}
            answers={answers}
            goTo={(id) => setStep(steps.findIndex((s) => s.id === id))}
          />
        )}
      </div>

      {(error || state.error) && (
        <p className="text-sm text-bad mt-4" role="alert">
          {error || state.error}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-line">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={back}
          disabled={step === 0 || pending}
        >
          Back
        </button>

        {step < last ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Continue
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Submitting…' : 'Submit application'}
          </button>
        )}
      </div>

      {step === last && (
        <div
          className="mt-4 rounded-xl p-3.5 text-xs text-coffee leading-relaxed"
          style={{ background: 'var(--color-cream)', border: '1px solid var(--color-line)' }}
        >
          <span className="font-bold text-espresso">Your data is safe with us.</span>{' '}
          The details and CV you submit are used only to assess your application for this
          role at RJ&rsquo;s Coffee. They are stored securely, kept confidential, and
          shared solely with our hiring team &mdash; never sold or given to third parties.
          You may request access to or deletion of your information at any time by
          contacting us. By submitting, you consent to RJ&rsquo;s Coffee processing your
          application on this basis.
        </div>
      )}
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function QuestionStep({
  q,
  value,
  onChange,
}: {
  q: Q
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p
        className="text-lg font-bold text-espresso mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {q.text} {q.required && <span className="text-bad">*</span>}
      </p>
      {q.type === 'MULTIPLE_CHOICE' ? (
        <div className="grid gap-2">
          {q.options.map((o) => {
            const active = value === o
            return (
              <button
                type="button"
                key={o}
                onClick={() => onChange(o)}
                className="text-left card p-3 transition-colors"
                style={{
                  borderColor: active ? 'var(--color-brand-red)' : 'var(--color-line)',
                  background: active ? 'rgba(228,24,28,0.04)' : '#fff',
                  boxShadow: 'none',
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2"
                    style={{
                      borderColor: active
                        ? 'var(--color-brand-red)'
                        : 'var(--color-line)',
                      background: active ? 'var(--color-brand-red)' : '#fff',
                    }}
                  />
                  <span className="text-coffee font-medium">{o}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : q.type === 'NUMBER' ? (
        <input
          className="input"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      ) : q.type === 'SHORT_TEXT' ? (
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      ) : (
        <textarea
          className="textarea"
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          autoFocus
        />
      )}
    </div>
  )
}

function CvUpload({
  cv,
  onChange,
  onError,
}: {
  cv: Cv | null
  onChange: (cv: Cv | null) => void
  onError: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)

  async function handleFile(file: File) {
    onError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        onError(data.error || 'Upload failed. Please try again.')
        onChange(null)
      } else {
        onChange({ key: data.key, name: data.name })
      }
    } catch {
      onError('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className="text-coffee mb-3">
        Upload your CV so our team can learn more about you. PDF or Word, up to 5&nbsp;MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {cv ? (
        <div className="card p-4 flex items-center justify-between" style={{ boxShadow: 'none' }}>
          <div className="flex items-center gap-3">
            <FileIcon />
            <div>
              <div className="font-semibold text-espresso">{cv.name}</div>
              <div className="text-xs text-good font-semibold">Uploaded</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.7rem' }}
            onClick={() => {
              onChange(null)
              inputRef.current?.click()
            }}
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files?.[0]
            if (f) handleFile(f)
          }}
          className="w-full rounded-xl p-8 text-center transition-colors"
          style={{
            border: `2px dashed ${drag ? 'var(--color-brand-red)' : 'var(--color-line)'}`,
            background: drag ? 'rgba(228,24,28,0.03)' : '#fff',
          }}
          disabled={uploading}
        >
          {uploading ? (
            <span className="text-coffee font-semibold">Uploading…</span>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <UploadIcon />
              </div>
              <div className="font-semibold text-espresso">
                Click to upload or drag &amp; drop
              </div>
              <div className="text-xs text-muted mt-1">PDF, DOC or DOCX · max 5 MB</div>
            </>
          )}
        </button>
      )}
    </div>
  )
}

function Review({
  name,
  email,
  phone,
  coverNote,
  setCoverNote,
  cv,
  questions,
  answers,
  goTo,
}: {
  name: string
  email: string
  phone: string
  coverNote: string
  setCoverNote: (v: string) => void
  cv: Cv | null
  questions: Q[]
  answers: Record<string, string>
  goTo: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="card p-4" style={{ boxShadow: 'none' }}>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-espresso">Your details</h4>
          <button
            type="button"
            className="text-sm text-accent font-semibold"
            onClick={() => goTo('about')}
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-coffee mt-1">
          {name} · {email} · {phone}
        </p>
      </div>

      <div className="card p-4" style={{ boxShadow: 'none' }}>
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-espresso">CV</h4>
          <button
            type="button"
            className="text-sm text-accent font-semibold"
            onClick={() => goTo('cv')}
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-coffee mt-1">{cv?.name ?? 'Not uploaded'}</p>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="card p-4" style={{ boxShadow: 'none' }}>
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-bold text-espresso text-sm">
              {i + 1}. {q.text}
            </h4>
            <button
              type="button"
              className="text-sm text-accent font-semibold shrink-0"
              onClick={() => goTo(q.id)}
            >
              Edit
            </button>
          </div>
          <p className="text-sm text-coffee mt-1 whitespace-pre-wrap">
            {answers[q.id]?.trim() || <span className="text-muted italic">No answer</span>}
          </p>
        </div>
      ))}

      <div className="space-y-1.5">
        <label className="label">Anything else you&rsquo;d like us to know?</label>
        <textarea
          className="textarea"
          rows={3}
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
        />
      </div>
    </div>
  )
}

/* icons (no emoji) */
function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0L7 9m5-5 5 5"
        stroke="var(--color-brand-red)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="var(--color-brand-red)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="var(--color-brand-green)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="var(--color-brand-green)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
