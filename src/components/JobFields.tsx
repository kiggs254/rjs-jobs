import { EMPLOYMENT_LABEL } from './ui'

type JobLike = {
  title?: string
  location?: string
  employmentType?: string
  description?: string
  status?: string
}

// Shared form fields for create + edit job forms.
export function JobFields({ job }: { job?: JobLike }) {
  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <label className="label" htmlFor="title">
          Job title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={job?.title ?? ''}
          className="input"
          placeholder="e.g. Barista"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="label" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={job?.location ?? 'Nairobi'}
            className="input"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label" htmlFor="employmentType">
            Type
          </label>
          <select
            id="employmentType"
            name="employmentType"
            defaultValue={job?.employmentType ?? 'FULL_TIME'}
            className="select"
          >
            {Object.entries(EMPLOYMENT_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={job?.status ?? 'DRAFT'}
            className="select"
          >
            <option value="DRAFT">Draft (hidden)</option>
            <option value="OPEN">Open (accepting)</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={job?.description ?? ''}
          className="textarea"
          placeholder="Describe the role, responsibilities, and what you're looking for. The AI uses this to generate tailored screening questions."
        />
      </div>
    </div>
  )
}
