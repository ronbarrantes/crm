import { Link, createFileRoute } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowRight, Plus } from 'lucide-react'
import { Avatar, Badge, ButtonLink, Card, CardHeader, Empty } from '~/components/ui'
import { dayAndTime, isOverdue, relativeDay } from '~/lib/format'
import { activeEvent, clearFollowUp, inbox, personById, toggleNextStep, useData } from '~/lib/store'
import { meetingTypeLabel, nextStepLabel, signalLabel } from '~/lib/vocab'

export const Route = createFileRoute('/')({ component: Today })

function Today() {
  const data = useData()
  const event = activeEvent(data)
  const toTriage = inbox(data)
  const upcoming = data.meetings.filter((m) => m.status === 'planned').sort((a, b) => a.at.localeCompare(b.at))

  const soon = new Date()
  soon.setDate(soon.getDate() + 3)
  const dueSteps = data.nextSteps
    .filter((n) => !n.done && n.type !== 'none' && n.dueAt && new Date(n.dueAt) <= soon)
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))
  const followUps = data.people
    .filter((p) => p.followUpAt && new Date(p.followUpAt) <= soon)
    .sort((a, b) => (a.followUpAt ?? '').localeCompare(b.followUpAt ?? ''))
  const recentSignals = [...data.signals].reverse().slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div>
          <p className="label">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-1 text-2xl sm:text-[1.75rem]">{greeting}</h1>
        </div>
        <div className="hidden sm:block">
          <ButtonLink to="/capture" variant="primary">
            <Plus aria-hidden className="size-5" /> Capture someone
          </ButtonLink>
        </div>
      </header>

      {/* Big capture entry for phones */}
      <Link
        to="/capture"
        className="mb-5 flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-accent px-5 py-4 text-on-accent sm:hidden"
      >
        <span>
          <span className="block text-lg font-semibold">Capture someone</span>
          <span className="block text-sm opacity-85">{event ? `Tagged: ${event.name}` : 'Name and one line. Done in seconds.'}</span>
        </span>
        <Plus aria-hidden className="size-7" />
      </Link>

      {toTriage.length > 0 && (
        <Link
          to="/inbox"
          className="mb-5 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-rule bg-soft px-4 py-3 text-on-soft"
        >
          <span>
            <span className="font-semibold">
              {toTriage.length} {toTriage.length === 1 ? 'person' : 'people'} to triage
            </span>
            <span className="block text-sm opacity-85">Fill in details while it’s fresh.</span>
          </span>
          <ArrowRight aria-hidden className="size-5 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card aria-labelledby="upcoming" className="lg:col-span-2">
          <CardHeader id="upcoming" title="Upcoming meetings" />
          {upcoming.length === 0 ? (
            <Empty>No meetings planned. Plan one from a person’s page.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {upcoming.map((m) => {
                const p = personById(data, m.personId)
                if (!p) return null
                return (
                  <li key={m.id}>
                    <Link
                      to="/meetings/$meetingId/brief"
                      params={{ meetingId: m.id }}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-soft/60"
                    >
                      <Avatar name={p.name} photoUrl={p.photoUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{p.name}</span>
                        <span className="block truncate text-sm text-ink-2">{m.intent || 'No stated intent yet'}</span>
                      </span>
                      <span className="text-right text-sm">
                        <span className="block font-medium">{dayAndTime(m.at)}</span>
                        <span className="text-ink-2">{meetingTypeLabel[m.type]} · Brief →</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="due">
          <CardHeader id="due" title="Due soon" />
          {dueSteps.length === 0 && followUps.length === 0 ? (
            <Empty>Nothing due. Nice.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {followUps.map((p) => (
                <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    id={`fu-${p.id}`}
                    className="mt-1 size-5 accent-[var(--accent)]"
                    onChange={() => clearFollowUp(p.id)}
                  />
                  <label htmlFor={`fu-${p.id}`} className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">Follow up with {p.name}</span>
                    <DueLabel iso={p.followUpAt!} />
                  </label>
                </li>
              ))}
              {dueSteps.map((n) => {
                const p = personById(data, n.personId)
                return (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      id={`ns-${n.id}`}
                      className="mt-1 size-5 accent-[var(--accent)]"
                      checked={n.done}
                      onChange={() => toggleNextStep(n.id)}
                    />
                    <label htmlFor={`ns-${n.id}`} className="min-w-0 flex-1 text-sm">
                      <span className="block font-medium">{n.description}</span>
                      <span className="text-ink-2">
                        {n.owner === 'me' ? 'I owe' : 'They owe'} · {p?.name} · {nextStepLabel[n.type]}
                      </span>
                      <DueLabel iso={n.dueAt!} />
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="signals" className="lg:col-span-2">
          <CardHeader
            id="signals"
            title="Recent signals"
            action={
              <Link to="/ideas" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                Ideas
              </Link>
            }
          />
          {recentSignals.length === 0 ? (
            <Empty>Signals from your debriefs show up here.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {recentSignals.map((s) => {
                const p = personById(data, s.personId)
                return (
                  <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                    <Badge tone={s.type === 'noise' ? 'neutral' : 'accent'} className="mt-0.5">
                      {signalLabel[s.type]}
                    </Badge>
                    <p className={clsx('min-w-0 flex-1 text-sm', s.type === 'noise' && 'text-ink-2 line-through decoration-rule-strong')}>
                      {s.text} <span className="text-ink-2 no-underline">· {p?.name}</span>
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="ideas-glance">
          <CardHeader id="ideas-glance" title="Ideas" />
          <ul className="divide-y divide-rule">
            {data.ideas.map((i) => {
              const count = data.signals.filter((s) => s.ideaIds.includes(i.id) && s.type !== 'noise').length
              return (
                <li key={i.id}>
                  <Link to="/ideas/$ideaId" params={{ ideaId: i.id }} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-soft/60">
                    <span className="min-w-0 flex-1 text-sm font-medium">{i.name}</span>
                    <span className="text-sm whitespace-nowrap text-ink-2">
                      {count} {count === 1 ? 'signal' : 'signals'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function DueLabel({ iso }: { iso: string }) {
  const overdue = isOverdue(iso)
  return <span className={clsx('block text-sm', overdue ? 'font-medium text-danger' : 'text-ink-2')}>{overdue ? `Overdue · ${relativeDay(iso)}` : relativeDay(iso)}</span>
}
