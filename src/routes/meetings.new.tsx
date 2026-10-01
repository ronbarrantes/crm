import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, ChipGroup, Field, PageHeader } from '~/components/ui'
import { fromLocalInput, toLocalInput } from '~/lib/format'
import { personById, planMeeting, useData } from '~/lib/store'
import type { MeetingType } from '~/lib/types'
import { meetingTypeLabel, meetingTypes } from '~/lib/vocab'

type Search = { personId?: string; after?: string }

export const Route = createFileRoute('/meetings/new')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    personId: typeof s.personId === 'string' ? s.personId : undefined,
    after: typeof s.after === 'string' ? s.after : undefined,
  }),
  component: PlanMeeting,
})

function defaultTime() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

function PlanMeeting() {
  const data = useData()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [personId, setPersonId] = useState(search.personId ?? '')
  const person = personById(data, personId)
  const ideas = data.ideas.filter((i) => person?.ideaIds.includes(i.id))
  const [ideaId, setIdeaId] = useState(ideas[0]?.id ?? '')
  const [questions, setQuestions] = useState<string[]>(() => padTo3(data.ideas.find((i) => i.id === (ideas[0]?.id ?? ''))?.keyQuestions ?? []))
  const [at, setAt] = useState(toLocalInput(defaultTime()))
  const [type, setType] = useState<MeetingType>('coffee')
  const [intent, setIntent] = useState('')
  const people = data.people.filter((p) => !p.needsTriage).sort((a, b) => a.name.localeCompare(b.name))

  function pickIdea(id: string) {
    setIdeaId(id)
    setQuestions(padTo3(data.ideas.find((i) => i.id === id)?.keyQuestions ?? []))
  }

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!personId || saving) return
    setSaving(true)
    setSaveError('')
    try {
      const meetingId = await planMeeting({ personId, at: fromLocalInput(at), type, intent: intent.trim(), questions })
      navigate({ to: '/meetings/$meetingId/brief', params: { meetingId } })
    } catch {
      setSaveError('Couldn’t save the meeting. Everything you entered is still here. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        back={
          person && (
            <Link to="/people/$personId" params={{ personId: person.id }} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-2">
              <ArrowLeft aria-hidden className="size-4" /> {person.name}
            </Link>
          )
        }
        title={search.after ? 'Plan the next meeting' : 'Plan a meeting'}
        subtitle="Write your 3 questions now, so you can put the phone away during the conversation."
      />
      <Card className="p-4 sm:p-6">
        <form onSubmit={save} className="flex flex-col gap-5">
          {!search.personId && (
            <Field label="With" htmlFor="pm-person">
              <select id="pm-person" className="field" required value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">Choose a person…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="When" htmlFor="pm-at">
              <input id="pm-at" type="datetime-local" className="field" required value={at} onChange={(e) => setAt(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <ChipGroup legend="Type" options={meetingTypes.map((t) => ({ value: t, label: meetingTypeLabel[t] }))} value={type} onChange={setType} />
            </div>
          </div>
          <Field label="What did they say it’s for?" htmlFor="pm-intent" hint={intent.trim() ? undefined : 'If you’re not sure, consider asking what they have in mind before you meet.'}>
            <input id="pm-intent" className="field" placeholder="e.g. wants to hear about the checklist idea" value={intent} onChange={(e) => setIntent(e.target.value)} />
          </Field>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">My 3 questions</legend>
            {data.ideas.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pm-idea" className="text-xs text-ink-2">
                  Start from an idea’s Key Questions
                </label>
                <select id="pm-idea" className="field text-sm" value={ideaId} onChange={(e) => pickIdea(e.target.value)}>
                  <option value="">Write my own</option>
                  {(ideas.length ? ideas : data.ideas).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label htmlFor={`pm-q${i}`} className="sr-only">
                  Question {i + 1}
                </label>
                <div className="flex items-start gap-2">
                  <span aria-hidden className="label mt-3 w-4">
                    {i + 1}
                  </span>
                  <textarea
                    id={`pm-q${i}`}
                    rows={2}
                    className="field"
                    value={q}
                    placeholder="Ask about something that already happened, not what they would do."
                    onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                </div>
              </div>
            ))}
          </fieldset>

          <div className="flex gap-2 border-t border-rule pt-4">
            <Button type="submit" variant="primary" disabled={!personId || saving}>
              {saving ? 'Saving…' : 'Save and see Brief'}
            </Button>
          </div>
          {saveError && (
            <p role="alert" className="text-sm font-medium text-danger">
              {saveError}
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}

function padTo3(qs: string[]) {
  return [...qs, '', '', ''].slice(0, 3)
}
