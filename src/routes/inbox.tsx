import { createFileRoute } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar, Button, ButtonLink, Card, ChipGroup, Field, PageHeader } from '~/components/ui'
import { dayAndTime, fromLocalInput, toLocalDateInput } from '~/lib/format'
import { eventById, inbox, mergeInto, updatePerson, useData } from '~/lib/store'
import type { Person } from '~/lib/types'
import { stageLabel, stages } from '~/lib/vocab'

type Search = { id?: string }

export const Route = createFileRoute('/inbox')({
  validateSearch: (s: Record<string, unknown>): Search => (typeof s.id === 'string' ? { id: s.id } : {}),
  component: Inbox,
})

function Inbox() {
  const data = useData()
  const items = inbox(data)
  const { id } = Route.useSearch()
  const navigate = Route.useNavigate()
  const selected = items.find((p) => p.id === id)
  const [done, setDone] = useState('')

  const select = (pid?: string) => navigate({ search: pid ? { id: pid } : {}, replace: !!id })

  return (
    <div className="mx-auto max-w-6xl">
      <div className={clsx(selected && 'hidden lg:block')}>
        <PageHeader
          title="Inbox"
          subtitle={items.length ? `${items.length} to triage. Aim for empty by tomorrow morning.` : undefined}
        />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {done}
      </p>

      {items.length === 0 ? (
        <Card className="mx-auto max-w-md px-6 py-10 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-ok-soft text-ok">
            <Check aria-hidden />
          </span>
          <h2 className="text-lg">Inbox zero</h2>
          <p className="mt-1 text-ink-2">Everyone you captured has been triaged.</p>
          <ButtonLink to="/people" className="mt-4">
            See people
          </ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <ul aria-label="People to triage" className={clsx('flex flex-col gap-2', selected && 'hidden lg:flex')}>
            {items.map((p) => {
              const ev = eventById(data, p.eventId)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    aria-current={p.id === id ? 'true' : undefined}
                    className={clsx(
                      'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left',
                      p.id === id ? 'border-accent bg-soft' : 'border-rule bg-card hover:bg-soft/60',
                    )}
                  >
                    <Avatar name={p.name} photoUrl={p.photoUrl} />
                    <span className="min-w-0">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-sm text-ink-2">{p.hookLine}</span>
                      <span className="mt-1 block text-xs text-ink-2">
                        {ev ? `${ev.name} · ` : ''}
                        {dayAndTime(p.metAt)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {selected ? (
            <Triage
              key={selected.id}
              person={selected}
              onBack={() => select()}
              onDone={(msg) => {
                setDone(msg)
                const next = items.find((p) => p.id !== selected.id)
                select(next?.id)
              }}
            />
          ) : (
            <Card className="hidden place-items-center p-10 text-ink-2 lg:grid">Pick someone to triage.</Card>
          )}
        </div>
      )}
    </div>
  )
}

function inTwoDays() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

function Triage({ person, onBack, onDone }: { person: Person; onBack: () => void; onDone: (msg: string) => void }) {
  const data = useData()
  const [form, setForm] = useState({
    name: person.name,
    role: person.role ?? '',
    company: person.company ?? '',
    email: person.email ?? '',
    phone: person.phone ?? '',
    personalNotes: person.personalNotes ?? '',
    stage: person.stage,
    ideaIds: person.ideaIds,
    followUp: toLocalDateInput(person.followUpAt ?? inTwoDays()),
  })
  const [mergeTarget, setMergeTarget] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const others = data.people.filter((p) => !p.needsTriage && p.id !== person.id).sort((a, b) => a.name.localeCompare(b.name))
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function finish(e: React.FormEvent) {
    e.preventDefault()
    updatePerson(person.id, {
      name: form.name.trim() || person.name,
      role: form.role || undefined,
      company: form.company || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      personalNotes: form.personalNotes || undefined,
      stage: form.stage,
      ideaIds: form.ideaIds,
      followUpAt: form.followUp ? fromLocalInput(`${form.followUp}T09:00`) : null,
      needsTriage: false,
    })
    onDone(`${form.name} triaged.`)
  }

  return (
    <Card className="p-4 sm:p-6">
      <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-2 lg:hidden">
        <ArrowLeft aria-hidden className="size-4" /> Inbox
      </button>
      <div className="mb-5 flex items-center gap-3">
        <Avatar name={person.name} photoUrl={person.photoUrl} size="lg" />
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="text-xl outline-none">
            {person.name}
          </h2>
          <p className="text-ink-2">{person.hookLine}</p>
        </div>
      </div>

      <details className="mb-5 rounded-xl border border-rule px-4 py-2 open:pb-4">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">Already know them? Merge</summary>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Existing person" htmlFor="merge" hint="Their hook line and photo get added to that person, and this capture is removed.">
            <select id="merge" className="field" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
              <option value="">Choose…</option>
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.company ? ` · ${p.company}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Button
            disabled={!mergeTarget}
            onClick={() => {
              const target = others.find((p) => p.id === mergeTarget)
              mergeInto(person.id, mergeTarget)
              onDone(`Merged into ${target?.name}.`)
            }}
          >
            Merge
          </Button>
        </div>
      </details>

      <form onSubmit={finish} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="t-name">
            <input id="t-name" className="field" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Role" htmlFor="t-role">
            <input id="t-role" className="field" value={form.role} onChange={(e) => set('role', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Company" htmlFor="t-company">
            <input id="t-company" className="field" value={form.company} onChange={(e) => set('company', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Email" htmlFor="t-email">
            <input id="t-email" type="email" inputMode="email" className="field" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Phone" htmlFor="t-phone">
            <input id="t-phone" type="tel" inputMode="tel" className="field" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Follow up by" htmlFor="t-follow" hint="Default: two days from now.">
            <input id="t-follow" type="date" className="field" value={form.followUp} onChange={(e) => set('followUp', e.target.value)} />
          </Field>
        </div>
        <Field label="Personal notes" htmlFor="t-notes" hint="Family, hobbies, background. Anything human.">
          <textarea id="t-notes" rows={3} className="field" value={form.personalNotes} onChange={(e) => set('personalNotes', e.target.value)} />
        </Field>
        <ChipGroup
          legend="Relationship"
          options={stages.map((s) => ({ value: s, label: stageLabel[s] }))}
          value={form.stage}
          onChange={(v) => set('stage', v)}
        />
        <ChipGroup
          legend="Related ideas"
          multiple
          options={data.ideas.map((i) => ({ value: i.id, label: i.name }))}
          value={form.ideaIds}
          onChange={(v) => set('ideaIds', form.ideaIds.includes(v) ? form.ideaIds.filter((x) => x !== v) : [...form.ideaIds, v])}
        />
        <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
          <Button type="submit" variant="primary">
            <Check aria-hidden className="size-5" /> Done
          </Button>
        </div>
      </form>
    </Card>
  )
}
