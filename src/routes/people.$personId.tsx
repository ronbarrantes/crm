import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowLeft, CalendarPlus, Mail, NotebookPen, Phone } from 'lucide-react'
import { PersonBadges } from '~/components/person-badges'
import { Avatar, Badge, Button, ButtonLink, Card, CardHeader, ChipGroup, Empty } from '~/components/ui'
import { dayAndTime, isOverdue, longDate, relativeDay } from '~/lib/format'
import { eventById, meetingsFor, openNextSteps, personById, startUnplannedMeeting, toggleNextStep, updatePerson, useData } from '~/lib/store'
import { flagLabel, flags, meetingTypeLabel, nextStepLabel, signalLabel, stageLabel, stages } from '~/lib/vocab'

export const Route = createFileRoute('/people/$personId')({ component: PersonPage })

function PersonPage() {
  const { personId } = Route.useParams()
  const data = useData()
  const navigate = useNavigate()
  const person = personById(data, personId)

  if (!person) {
    return (
      <Card className="p-8 text-center">
        <p>This person doesn’t exist anymore.</p>
        <ButtonLink to="/people" className="mt-4">
          Back to people
        </ButtonLink>
      </Card>
    )
  }

  const event = eventById(data, person.eventId)
  const meetings = meetingsFor(data, person.id)
  const signals = data.signals.filter((s) => s.personId === person.id)
  const steps = openNextSteps(data, person.id)
  const linkedIdeas = data.ideas.filter((i) => person.ideaIds.includes(i.id))

  return (
    <div className="flex flex-col gap-4">
      <Link to="/people" className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-2 lg:hidden">
        <ArrowLeft aria-hidden className="size-4" /> People
      </Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={person.name} photoUrl={person.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl">{person.name}</h1>
            {(person.role || person.company) && <p className="text-ink-2">{[person.role, person.company].filter(Boolean).join(' · ')}</p>}
            <p className="mt-2">{person.hookLine}</p>
            <div className="mt-3">
              <PersonBadges person={person} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col">
            <ButtonLink to="/meetings/new" search={{ personId: person.id }} variant="primary">
              <CalendarPlus aria-hidden className="size-5" /> Plan meeting
            </ButtonLink>
            <Button
              onClick={async () => {
                const meetingId = await startUnplannedMeeting(person.id)
                navigate({ to: '/meetings/$meetingId/debrief', params: { meetingId } })
              }}
            >
              <NotebookPen aria-hidden className="size-5" /> Debrief a chat
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-rule pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="label">How we met</dt>
            <dd className="mt-0.5">
              {event ? `${event.name}${event.place ? `, ${event.place}` : ''}` : 'Added manually'} · {longDate(person.metAt)}
              {person.introducedBy && <span className="block text-ink-2">Introduced by {person.introducedBy}</span>}
            </dd>
          </div>
          <div>
            <dt className="label">Contact</dt>
            <dd className="mt-0.5 flex flex-col gap-1">
              {person.email && (
                <a href={`mailto:${person.email}`} className="inline-flex items-center gap-1.5 text-accent underline-offset-4 hover:underline">
                  <Mail aria-hidden className="size-4" /> {person.email}
                </a>
              )}
              {person.phone && (
                <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1.5 text-accent underline-offset-4 hover:underline">
                  <Phone aria-hidden className="size-4" /> {person.phone}
                </a>
              )}
              {!person.email && !person.phone && <span className="text-ink-2">None yet</span>}
            </dd>
          </div>
          {person.personalNotes && (
            <div className="sm:col-span-2">
              <dt className="label">Personal notes</dt>
              <dd className="mt-0.5 whitespace-pre-line">{person.personalNotes}</dd>
            </div>
          )}
          {linkedIdeas.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="label">Ideas</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {linkedIdeas.map((i) => (
                  <Link key={i.id} to="/ideas/$ideaId" params={{ ideaId: i.id }}>
                    <Badge tone="accent">{i.name}</Badge>
                  </Link>
                ))}
              </dd>
            </div>
          )}
          {person.followUpAt && (
            <div>
              <dt className="label">Follow up</dt>
              <dd className={clsx('mt-0.5', isOverdue(person.followUpAt) && 'font-medium text-danger')}>
                {isOverdue(person.followUpAt) ? 'Overdue · ' : ''}
                {relativeDay(person.followUpAt)}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card aria-labelledby="steps">
          <CardHeader id="steps" title="Open next steps" />
          {steps.length === 0 ? (
            <Empty>No open next steps.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {steps.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <input id={`st-${n.id}`} type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={n.done} onChange={() => toggleNextStep(n.id)} />
                  <label htmlFor={`st-${n.id}`} className="text-sm">
                    <span className="block font-medium">{n.description}</span>
                    <span className="text-ink-2">
                      {n.owner === 'me' ? 'I owe them' : 'They owe me'} · {nextStepLabel[n.type]}
                      {n.dueAt && ` · ${relativeDay(n.dueAt)}`}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="judge" className="p-4">
          <h2 id="judge" className="mb-3 text-[0.95rem]">
            Relationship and flags
          </h2>
          <div className="flex flex-col gap-4">
            <ChipGroup
              legend="Relationship"
              hideLegend
              options={stages.map((s) => ({ value: s, label: stageLabel[s] }))}
              value={person.stage}
              onChange={(v) => updatePerson(person.id, { stage: v })}
            />
            <ChipGroup
              legend="Flags"
              multiple
              options={flags.map((f) => ({ value: f, label: flagLabel[f] }))}
              value={person.flags}
              onChange={(v) =>
                updatePerson(person.id, { flags: person.flags.includes(v) ? person.flags.filter((f) => f !== v) : [...person.flags, v] })
              }
            />
          </div>
        </Card>
      </div>

      <Card aria-labelledby="timeline">
        <CardHeader id="timeline" title="Timeline" />
        {meetings.length === 0 ? (
          <Empty>No meetings yet. Plan one, or debrief a chat you already had.</Empty>
        ) : (
          <ol className="divide-y divide-rule">
            {meetings.map((m) => {
              const mSignals = signals.filter((s) => s.meetingId === m.id)
              return (
                <li key={m.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">
                      {meetingTypeLabel[m.type]} · {m.status === 'planned' ? dayAndTime(m.at) : longDate(m.at)}
                    </h3>
                    {m.status === 'planned' ? (
                      <div className="flex gap-2">
                        <ButtonLink to="/meetings/$meetingId/brief" params={{ meetingId: m.id }} className="min-h-10 text-sm">
                          Brief
                        </ButtonLink>
                        <ButtonLink to="/meetings/$meetingId/debrief" params={{ meetingId: m.id }} className="min-h-10 text-sm">
                          Debrief
                        </ButtonLink>
                      </div>
                    ) : (
                      <Badge tone="ok">Debriefed</Badge>
                    )}
                  </div>
                  {m.intent && <p className="mt-1 text-sm text-ink-2">For: {m.intent}</p>}
                  {m.takeaways.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      {m.takeaways.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {mSignals.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {mSignals.map((s) => (
                        <li key={s.id} className="flex items-start gap-2 text-sm">
                          <Badge tone={s.type === 'noise' ? 'neutral' : 'accent'} className="mt-0.5">
                            {signalLabel[s.type]}
                          </Badge>
                          <span className={clsx(s.type === 'noise' && 'text-ink-2')}>{s.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </Card>
    </div>
  )
}
