import { Link, createFileRoute } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Badge, Button, Card, CardHeader, ChipGroup, DraftTextarea, Empty } from '~/components/ui'
import { addBelief, personById, removeBelief, updateIdea, useData } from '~/lib/store'
import type { SignalType } from '~/lib/types'
import { ideaStatusLabel, ideaStatuses, signalLabel } from '~/lib/vocab'

export const Route = createFileRoute('/ideas/$ideaId')({ component: IdeaPage })

function IdeaPage() {
  const { ideaId } = Route.useParams()
  const data = useData()
  const idea = data.ideas.find((i) => i.id === ideaId)
  const [belief, setBelief] = useState('')
  if (!idea) return <p>Idea not found.</p>

  const beliefs = data.beliefs.filter((b) => b.ideaId === idea.id)
  const signals = data.signals.filter((s) => s.ideaIds.includes(idea.id))
  const evidence = signals.filter((s) => s.type !== 'noise')
  const noise = signals.filter((s) => s.type === 'noise')
  const people = data.people.filter((p) => p.ideaIds.includes(idea.id))
  const byType = evidence.reduce<Partial<Record<SignalType, number>>>((acc, s) => ({ ...acc, [s.type]: (acc[s.type] ?? 0) + 1 }), {})
  const keyQs = [...idea.keyQuestions, '', '', ''].slice(0, 3)

  return (
    <div className="flex flex-col gap-4">
      <Link to="/ideas" className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-2 lg:hidden">
        <ArrowLeft aria-hidden className="size-4" /> Ideas
      </Link>

      <Card className="p-4 sm:p-6">
        <h1 className="text-2xl">{idea.name}</h1>
        <label htmlFor="idea-desc" className="sr-only">
          Description
        </label>
        <DraftTextarea
          id="idea-desc"
          rows={2}
          className="field mt-3"
          placeholder="Who is it for, and what problem does it solve?"
          value={idea.description}
          onSave={(description) => updateIdea(idea.id, { description })}
        />
        <div className="mt-4">
          <ChipGroup
            legend="Status"
            options={ideaStatuses.map((s) => ({ value: s, label: ideaStatusLabel[s] }))}
            value={idea.status}
            onChange={(v) => updateIdea(idea.id, { status: v })}
          />
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-rule pt-4 text-center">
          <Stat label="People" value={people.length} />
          <Stat label="Signals" value={evidence.length} />
          <Stat label="Noise" value={noise.length} muted />
        </dl>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card aria-labelledby="kq">
          <CardHeader id="kq" title="Key Questions" />
          <div className="flex flex-col gap-2 p-4">
            <p className="text-sm text-ink-2">The 3 most important things to learn. They pre-fill your meeting questions.</p>
            {keyQs.map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <span aria-hidden className="label mt-3 w-4">
                  {i + 1}
                </span>
                <label htmlFor={`kq-${i}`} className="sr-only">
                  Key Question {i + 1}
                </label>
                <DraftTextarea
                  id={`kq-${i}`}
                  rows={2}
                  className="field text-sm"
                  value={q}
                  onSave={(text) => updateIdea(idea.id, { keyQuestions: keyQs.map((x, j) => (j === i ? text : x)) })}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card aria-labelledby="beliefs">
          <CardHeader id="beliefs" title="Beliefs" />
          {beliefs.length === 0 ? (
            <Empty>What do you believe is true? Write it so it could turn out false.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {beliefs.map((b) => (
                <li key={b.id} className="flex items-start gap-2 px-4 py-3 text-sm">
                  <span className="flex-1">{b.statement}</span>
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-danger-soft hover:text-danger"
                    aria-label={`Delete belief: ${b.statement}`}
                    onClick={() => removeBelief(b.id)}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2 border-t border-rule p-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!belief.trim()) return
              addBelief(idea.id, belief.trim())
              setBelief('')
            }}
          >
            <label htmlFor="new-belief" className="sr-only">
              New belief
            </label>
            <input id="new-belief" className="field text-sm" placeholder="Add a belief" value={belief} onChange={(e) => setBelief(e.target.value)} />
            <Button type="submit" aria-label="Add belief">
              <Plus aria-hidden className="size-5" />
            </Button>
          </form>
        </Card>
      </div>

      <Card aria-labelledby="evidence">
        <CardHeader
          id="evidence"
          title="What people told me"
          action={
            <span className="flex flex-wrap justify-end gap-1">
              {Object.entries(byType).map(([t, n]) => (
                <Badge key={t}>
                  {signalLabel[t as SignalType]} {n}
                </Badge>
              ))}
            </span>
          }
        />
        {signals.length === 0 ? (
          <Empty>No signals yet. They come from your debriefs.</Empty>
        ) : (
          <ul className="divide-y divide-rule">
            {[...evidence, ...noise].map((s) => {
              const p = personById(data, s.personId)
              return (
                <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                  <Badge tone={s.type === 'noise' ? 'neutral' : 'accent'} className="mt-0.5">
                    {signalLabel[s.type]}
                  </Badge>
                  <p className={clsx('flex-1 text-sm', s.type === 'noise' && 'text-ink-2')}>
                    {s.text}
                    {p && (
                      <>
                        {' '}
                        ·{' '}
                        <Link to="/people/$personId" params={{ personId: p.id }} className="text-accent underline-offset-4 hover:underline">
                          {p.name}
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card aria-labelledby="idea-people">
        <CardHeader id="idea-people" title="People" />
        {people.length === 0 ? (
          <Empty>Link people to this idea during triage.</Empty>
        ) : (
          <ul className="divide-y divide-rule">
            {people.map((p) => (
              <li key={p.id}>
                <Link to="/people/$personId" params={{ personId: p.id }} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-soft/60">
                  <Avatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-sm text-ink-2">{p.company}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className={clsx('text-2xl font-semibold', muted && 'text-ink-2')}>{value}</dd>
    </div>
  )
}
