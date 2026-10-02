import { Link, Outlet, createFileRoute, useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PersonBadges } from '~/components/person-badges'
import { Avatar, PageHeader } from '~/components/ui'
import { dayDiff } from '~/lib/format'
import { openNextSteps, progressFor, useData } from '~/lib/store'
import type { Data, Person } from '~/lib/types'
import { flagLabel, flags, progressRank, stageLabel, stages } from '~/lib/vocab'

export const Route = createFileRoute('/people')({ component: PeopleLayout })

type Filter = 'all' | 'due' | `stage:${string}` | `idea:${string}` | `flag:${string}`

/** "Needs attention" order: follow-up due, then open next steps, then strongest progress. */
function attentionScore(d: Data, p: Person) {
  let score = 0
  if (p.followUpAt && dayDiff(p.followUpAt) <= 0) score += 100
  score += openNextSteps(d, p.id).length * 10
  score += progressRank[progressFor(d, p.id)]
  return score
}

function PeopleLayout() {
  const data = useData()
  const { personId } = useParams({ strict: false })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<'attention' | 'name' | 'recent'>('attention')

  const people = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.people
      .filter((p) => !p.needsTriage)
      .filter((p) => !q || [p.name, p.hookLine, p.company, p.role].some((f) => f?.toLowerCase().includes(q)))
      .filter((p) => {
        if (filter === 'all') return true
        if (filter === 'due') return (p.followUpAt && dayDiff(p.followUpAt) <= 0) || openNextSteps(data, p.id).length > 0
        const [kind, value] = filter.split(':')
        if (kind === 'stage') return p.stage === value
        if (kind === 'idea') return p.ideaIds.includes(value)
        if (kind === 'flag') return p.flags.includes(value as Person['flags'][number])
        return true
      })
      .sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : sort === 'recent'
            ? b.metAt.localeCompare(a.metAt)
            : attentionScore(data, b) - attentionScore(data, a),
      )
  }, [data, query, filter, sort])

  return (
    <div className="mx-auto max-w-6xl">
      <div className={clsx(personId && 'hidden lg:block')}>
        <PageHeader title="People" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <section aria-label="People list" className={clsx('flex flex-col gap-3', personId && 'hidden lg:flex')}>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-2" />
            <label htmlFor="people-search" className="sr-only">
              Search people
            </label>
            <input
              id="people-search"
              type="search"
              className="field pl-10"
              placeholder="Search name, company, notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="people-filter" className="sr-only">
                Filter
              </label>
              <select id="people-filter" className="field text-sm" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
                <option value="all">Everyone</option>
                <option value="due">Due / open steps</option>
                <optgroup label="Relationship">
                  {stages.map((s) => (
                    <option key={s} value={`stage:${s}`}>
                      {stageLabel[s]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Idea">
                  {data.ideas.map((i) => (
                    <option key={i.id} value={`idea:${i.id}`}>
                      {i.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Flag">
                  {flags.map((f) => (
                    <option key={f} value={`flag:${f}`}>
                      {flagLabel[f]}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label htmlFor="people-sort" className="sr-only">
                Sort
              </label>
              <select id="people-sort" className="field text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="attention">Needs attention</option>
                <option value="recent">Recently met</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {people.length} people
          </p>
          <ul className="flex flex-col gap-2">
            {people.map((p) => (
              <li key={p.id}>
                <Link
                  to="/people/$personId"
                  params={{ personId: p.id }}
                  className={clsx(
                    'flex items-start gap-3 border px-4 py-3',
                    p.id === personId ? 'border-accent bg-soft' : 'border-rule bg-card hover:bg-soft/60',
                  )}
                  aria-current={p.id === personId ? 'page' : undefined}
                >
                  <Avatar name={p.name} photoUrl={p.photoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{p.name}</span>
                    <span className="mb-1.5 block truncate text-sm text-ink-2">
                      {[p.role, p.company].filter(Boolean).join(' · ') || p.hookLine}
                    </span>
                    <PersonBadges person={p} />
                  </span>
                </Link>
              </li>
            ))}
            {people.length === 0 && <li className="py-6 text-center text-sm text-ink-2">No one matches.</li>}
          </ul>
        </section>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
