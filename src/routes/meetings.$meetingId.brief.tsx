import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { PersonBadges } from '~/components/person-badges'
import { Avatar, ButtonLink, Card } from '~/components/ui'
import { dayAndTime, longDate, relativeDay } from '~/lib/format'
import { eventById, lastDebriefed, openNextSteps, personById, useData } from '~/lib/store'
import { meetingTypeLabel, nextStepLabel } from '~/lib/vocab'

export const Route = createFileRoute('/meetings/$meetingId/brief')({ component: Brief })

/** Readable in 30 seconds on a phone. */
function Brief() {
  const { meetingId } = Route.useParams()
  const data = useData()
  const meeting = data.meetings.find((m) => m.id === meetingId)
  const person = meeting && personById(data, meeting.personId)
  if (!meeting || !person) return <p>Meeting not found.</p>

  const event = eventById(data, person.eventId)
  const last = lastDebriefed(data, person.id)
  const steps = openNextSteps(data, person.id)
  const mine = steps.filter((s) => s.owner === 'me')
  const theirs = steps.filter((s) => s.owner === 'them')

  return (
    <article className="mx-auto flex max-w-xl flex-col gap-4">
      <Link to="/people/$personId" params={{ personId: person.id }} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-2">
        <ArrowLeft aria-hidden className="size-4" /> {person.name}
      </Link>

      <header className="flex items-center gap-4">
        <Avatar name={person.name} photoUrl={person.photoUrl} size="lg" />
        <div className="min-w-0">
          <p className="label">
            Brief · {meetingTypeLabel[meeting.type]} · {dayAndTime(meeting.at)}
          </p>
          <h1 className="text-2xl">{person.name}</h1>
          <p className="text-ink-2">{[person.role, person.company].filter(Boolean).join(' · ') || person.hookLine}</p>
        </div>
      </header>
      <PersonBadges person={person} />

      {meeting.intent ? (
        <Card className="p-4">
          <h2 className="label">They said it’s for</h2>
          <p className="mt-1 text-lg">{meeting.intent}</p>
        </Card>
      ) : (
        <div role="note" className="flex gap-3 rounded-2xl bg-warn-soft p-4 text-warn">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p>
            <span className="font-semibold">No stated intent.</span> Consider asking what they have in mind before you meet.
          </p>
        </div>
      )}

      <Card className="p-4">
        <h2 className="label mb-2">My 3 questions</h2>
        {meeting.questions.length ? (
          <ol className="flex flex-col gap-3">
            {meeting.questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-lg leading-snug">
                <span aria-hidden className="font-semibold text-accent">
                  {i + 1}
                </span>
                {q.text}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-ink-2">No questions planned.</p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="label">How we met</h2>
        <p className="mt-1">
          {event ? `${event.name}${event.place ? `, ${event.place}` : ''}` : 'Added manually'} · {longDate(person.metAt)}
          {person.introducedBy && ` · introduced by ${person.introducedBy}`}
        </p>
        <p className="mt-1 text-ink-2">{person.hookLine}</p>
        {person.personalNotes && (
          <>
            <h2 className="label mt-4">Personal</h2>
            <p className="mt-1 whitespace-pre-line">{person.personalNotes}</p>
          </>
        )}
      </Card>

      {last && (
        <Card className="p-4">
          <h2 className="label">Last time · {relativeDay(last.at)}</h2>
          <ul className="mt-2 list-disc pl-5">
            {last.takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      )}

      {(mine.length > 0 || theirs.length > 0) && (
        <Card className="grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <h2 className="label">I owe them</h2>
            <ul className="mt-1 text-sm">
              {mine.length ? mine.map((n) => <li key={n.id}>{n.description}</li>) : <li className="text-ink-2">Nothing</li>}
            </ul>
          </div>
          <div>
            <h2 className="label">They owe me</h2>
            <ul className="mt-1 text-sm">
              {theirs.length ? (
                theirs.map((n) => (
                  <li key={n.id}>
                    {n.description} <span className="text-ink-2">({nextStepLabel[n.type]})</span>
                  </li>
                ))
              ) : (
                <li className="text-ink-2">Nothing</li>
              )}
            </ul>
          </div>
        </Card>
      )}

      {meeting.status === 'planned' && (
        <ButtonLink to="/meetings/$meetingId/debrief" params={{ meetingId: meeting.id }} variant="primary" className="min-h-14 text-lg">
          Debrief after the meeting
        </ButtonLink>
      )}
    </article>
  )
}
