import { Link, createFileRoute } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowLeft, Check, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Badge, Button, ButtonLink, Card, ChipGroup, Field } from '~/components/ui'
import { fromLocalInput, longDate } from '~/lib/format'
import { personById, saveDebrief, useData } from '~/lib/store'
import type { HonestyCheck, MeetingQuestion, NextStepType, SignalType } from '~/lib/types'
import { nextStepHint, nextStepLabel, nextStepTypes, progressLabel, signalHint, signalLabel, signalTypes } from '~/lib/vocab'

export const Route = createFileRoute('/meetings/$meetingId/debrief')({ component: Debrief })

type DraftSignal = { key: number; type: SignalType; text: string; ideaIds: string[] }

function Debrief() {
  const { meetingId } = Route.useParams()
  const data = useData()
  const meeting = data.meetings.find((m) => m.id === meetingId)
  const person = meeting && personById(data, meeting.personId)

  const [questions, setQuestions] = useState<MeetingQuestion[]>(meeting?.questions ?? [])
  const [takeaways, setTakeaways] = useState<string[]>(() => [...(meeting?.takeaways ?? []), '', '', ''].slice(0, 3))
  const [signals, setSignals] = useState<DraftSignal[]>([])
  const [sigType, setSigType] = useState<SignalType>('problem')
  const [sigText, setSigText] = useState('')
  const [sigIdea, setSigIdea] = useState(person?.ideaIds[0] ?? '')
  const [honesty, setHonesty] = useState<HonestyCheck>(meeting?.honesty ?? { gotFacts: null, pitchedTooEarly: null, theyPitchedMe: null })
  const [stepType, setStepType] = useState<NextStepType>('time')
  const [stepDesc, setStepDesc] = useState('')
  const [stepOwner, setStepOwner] = useState<'me' | 'them'>('them')
  const [stepDue, setStepDue] = useState('')
  const [notes, setNotes] = useState(meeting?.notes ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const sigInput = useRef<HTMLTextAreaElement>(null)
  const takeawayRef = useRef<HTMLInputElement>(null)

  if (!meeting || !person) return <p>Meeting not found.</p>

  if (saved) {
    return (
      <Card className="mx-auto max-w-md p-6 text-center" role="status">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-ok-soft text-ok">
          <Check aria-hidden />
        </span>
        <h1 className="text-xl">Debrief saved</h1>
        {stepType === 'time' ? (
          <>
            <p className="mt-1 text-ink-2">They agreed to more time. Plan it while it’s fresh?</p>
            <div className="mt-4 flex flex-col gap-2">
              <ButtonLink to="/meetings/new" search={{ personId: person.id, after: meeting.id }} variant="primary">
                Plan it now
              </ButtonLink>
              <ButtonLink to="/people/$personId" params={{ personId: person.id }} variant="ghost">
                Later
              </ButtonLink>
            </div>
          </>
        ) : (
          <ButtonLink to="/people/$personId" params={{ personId: person.id }} className="mt-4">
            Back to {person.name}
          </ButtonLink>
        )}
      </Card>
    )
  }

  function addSignal() {
    if (!sigText.trim()) return
    setSignals((s) => [...s, { key: Date.now(), type: sigType, text: sigText.trim(), ideaIds: sigIdea ? [sigIdea] : [] }])
    setSigText('')
    sigInput.current?.focus()
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    const tk = takeaways.map((t) => t.trim()).filter(Boolean)
    if (tk.length === 0) {
      setError('Add at least one takeaway.')
      takeawayRef.current?.focus()
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await saveDebrief({
      meetingId: meeting!.id,
      questions,
      takeaways: tk,
      signals: signals.map(({ type, text, ideaIds }) => ({ type, text, ideaIds })),
      honesty,
      nextStep: { type: stepType, description: stepDesc.trim(), owner: stepOwner, dueAt: stepDue ? fromLocalInput(`${stepDue}T09:00`) : undefined },
      notes: notes.trim(),
      })
      setSaved(true)
      window.scrollTo({ top: 0 })
    } catch {
      setSaveError('Couldn’t save the debrief. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const ideas = data.ideas
  const factsOnlyNoise = signals.length > 0 && signals.every((s) => s.type === 'noise')

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/people/$personId" params={{ personId: person.id }} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-2">
        <ArrowLeft aria-hidden className="size-4" /> {person.name}
      </Link>
      <header className="mb-5">
        <p className="label">Debrief · {longDate(meeting.at)}</p>
        <h1 className="text-2xl">What did you learn from {person.name}?</h1>
      </header>

      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        {questions.length > 0 && (
          <Section n={1} title="My 3 questions">
            <div className="flex flex-col gap-5">
              {questions.map((q, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <p className="font-medium">{q.text}</p>
                  <ChipGroup
                    legend={`Progress on question ${i + 1}`}
                    hideLegend
                    options={(['answered', 'partly', 'not-asked'] as const).map((v) => ({ value: v, label: progressLabel[v] }))}
                    value={q.progress}
                    onChange={(v) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, progress: v } : x)))}
                  />
                  <label htmlFor={`q-note-${i}`} className="sr-only">
                    What I learned about question {i + 1}
                  </label>
                  <textarea
                    id={`q-note-${i}`}
                    rows={2}
                    className="field"
                    placeholder="What I learned"
                    value={q.note}
                    onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section n={questions.length ? 2 : 1} title="Top 3 takeaways" required>
          <div className="flex flex-col gap-2">
            {takeaways.map((t, i) => (
              <div key={i}>
                <label htmlFor={`tk-${i}`} className="sr-only">
                  Takeaway {i + 1}
                </label>
                <input
                  ref={i === 0 ? takeawayRef : undefined}
                  id={`tk-${i}`}
                  className="field"
                  value={t}
                  placeholder={i === 0 ? 'The most important thing I learned' : `Takeaway ${i + 1}`}
                  aria-invalid={i === 0 && !!error}
                  aria-describedby={i === 0 && error ? 'tk-error' : undefined}
                  onChange={(e) => setTakeaways((ts) => ts.map((x, j) => (j === i ? e.target.value : x)))}
                />
              </div>
            ))}
            {error && (
              <p id="tk-error" role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
          </div>
        </Section>

        <Section n={questions.length ? 3 : 2} title="Signals" hint="Tag what you heard. Compliments and “I would…” count as Noise.">
          {signals.length > 0 && (
            <ul className="mb-4 flex flex-col gap-2">
              {signals.map((s) => (
                <li key={s.key} className="flex items-start gap-2 rounded-xl border border-rule px-3 py-2 text-sm">
                  <Badge tone={s.type === 'noise' ? 'neutral' : 'accent'} className="mt-0.5">
                    {signalLabel[s.type]}
                  </Badge>
                  <span className="flex-1">{s.text}</span>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-soft"
                    aria-label={`Remove signal: ${s.text}`}
                    onClick={() => setSignals((xs) => xs.filter((x) => x.key !== s.key))}
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3 rounded-xl bg-paper p-3">
            <ChipGroup
              legend="Signal type"
              hideLegend
              options={signalTypes.map((t) => ({ value: t, label: signalLabel[t] }))}
              hints={signalHint}
              value={sigType}
              onChange={setSigType}
            />
            <p className="text-xs text-ink-2">{signalHint[sigType]}</p>
            <label htmlFor="sig-text" className="sr-only">
              Signal note
            </label>
            <textarea
              ref={sigInput}
              id="sig-text"
              rows={2}
              className="field"
              placeholder="A direct quote if you can"
              value={sigText}
              onChange={(e) => setSigText(e.target.value)}
            />
            <div className="flex flex-wrap items-end gap-2">
              {ideas.length > 0 && (
                <div className="min-w-48 flex-1">
                  <label htmlFor="sig-idea" className="text-xs text-ink-2">
                    Idea
                  </label>
                  <select id="sig-idea" className="field text-sm" value={sigIdea} onChange={(e) => setSigIdea(e.target.value)}>
                    <option value="">No idea</option>
                    {ideas.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button onClick={addSignal} disabled={!sigText.trim()}>
                <Plus aria-hidden className="size-4" /> Add signal
              </Button>
            </div>
          </div>
          {factsOnlyNoise && <p className="mt-3 text-sm text-warn">Only noise so far. Was there anything about what actually happened to them?</p>}
        </Section>

        <Section n={questions.length ? 4 : 3} title="Honesty check">
          <div className="flex flex-col gap-4">
            <YesNo label="Did I get facts about their past (not compliments or hypotheticals)?" value={honesty.gotFacts} onChange={(v) => setHonesty((h) => ({ ...h, gotFacts: v }))} />
            <YesNo label="Did I pitch too early?" value={honesty.pitchedTooEarly} onChange={(v) => setHonesty((h) => ({ ...h, pitchedTooEarly: v }))} />
            <YesNo
              label="Were they pitching me?"
              hint="Yes adds the “Pitching me” flag."
              value={honesty.theyPitchedMe}
              onChange={(v) => setHonesty((h) => ({ ...h, theyPitchedMe: v }))}
            />
          </div>
        </Section>

        <Section n={questions.length ? 5 : 4} title="Next step">
          <div className="flex flex-col gap-4">
            <ChipGroup
              legend="What did they commit to?"
              options={nextStepTypes.map((t) => ({ value: t, label: nextStepLabel[t] }))}
              value={stepType}
              onChange={setStepType}
            />
            <p className="-mt-2 text-xs text-ink-2">{nextStepHint[stepType]}</p>
            {stepType === 'none' ? (
              <p className="rounded-xl bg-soft p-3 text-sm text-on-soft">
                That’s OK. Friendly chats count too. If this keeps happening with {person.name.split(' ')[0]}, it may be worth asking for something small next time.
              </p>
            ) : (
              <>
                <Field label="What exactly?" htmlFor="ns-desc">
                  <input id="ns-desc" className="field" placeholder="e.g. 20-minute demo next Tuesday" value={stepDesc} onChange={(e) => setStepDesc(e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ChipGroup
                    legend="Who owns it?"
                    options={[
                      { value: 'them', label: 'They do' },
                      { value: 'me', label: 'I do' },
                    ]}
                    value={stepOwner}
                    onChange={setStepOwner}
                  />
                  <Field label="Due" htmlFor="ns-due">
                    <input id="ns-due" type="date" className="field" value={stepDue} onChange={(e) => setStepDue(e.target.value)} />
                  </Field>
                </div>
              </>
            )}
          </div>
        </Section>

        <Section n={questions.length ? 6 : 5} title="Personal notes" hint="Anything human worth remembering.">
          <label htmlFor="notes" className="sr-only">
            Personal notes
          </label>
          <textarea id="notes" rows={3} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Section>

        <div className="sticky bottom-20 z-10 lg:bottom-4">
          {saveError && (
            <p role="alert" className="mb-2 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {saveError}
            </p>
          )}
          <button type="submit" className="min-h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-on-accent shadow-lg hover:bg-accent-hover">
            {saving ? 'Saving…' : 'Save debrief'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ n, title, hint, required, children }: { n: number; title: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  const id = `sec-${n}`
  return (
    <Card aria-labelledby={id} className="p-4 sm:p-5">
      <h2 id={id} className="flex items-baseline gap-2 text-lg">
        <span aria-hidden className="label">
          {n}
        </span>
        {title}
        {required && <span className="text-sm font-normal text-ink-2">(required)</span>}
      </h2>
      {hint && <p className="mt-0.5 text-sm text-ink-2">{hint}</p>}
      <div className="mt-3">{children}</div>
    </Card>
  )
}

function YesNo({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean | null; onChange: (v: boolean) => void }) {
  const name = label.replace(/\W+/g, '-').toLowerCase()
  return (
    <fieldset>
      <legend className="text-[0.95rem]">{label}</legend>
      {hint && <p className="text-xs text-ink-2">{hint}</p>}
      <div className="mt-2 flex gap-2">
        {[
          { v: true, l: 'Yes' },
          { v: false, l: 'No' },
        ].map(({ v, l }) => (
          <label
            key={l}
            className={clsx(
              'inline-flex min-h-11 min-w-20 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]',
              value === v ? 'border-accent bg-soft text-on-soft' : 'border-rule-strong bg-card hover:bg-soft',
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
