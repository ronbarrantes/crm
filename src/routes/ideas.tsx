import { Link, Outlet, createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, PageHeader } from '~/components/ui'
import { addIdea, useData } from '~/lib/store'
import { ideaStatusLabel } from '~/lib/vocab'

export const Route = createFileRoute('/ideas')({ component: IdeasLayout })

function IdeasLayout() {
  const data = useData()
  const navigate = useNavigate()
  const { ideaId } = useParams({ strict: false })
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  return (
    <div className="mx-auto max-w-6xl">
      <div className={clsx(ideaId && 'hidden lg:block')}>
        <PageHeader
          title="Ideas"
          subtitle="What you believe, and what people have actually told you."
          actions={
            !adding && (
              <Button variant="primary" onClick={() => setAdding(true)}>
                <Plus aria-hidden className="size-5" /> New idea
              </Button>
            )
          }
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <section aria-label="Ideas list" className={clsx('flex flex-col gap-2', ideaId && 'hidden lg:flex')}>
          {adding && (
            <form
              className="flex flex-col gap-2 rounded-2xl border border-rule bg-card p-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!name.trim()) return
                const ideaId = await addIdea(name.trim())
                setName('')
                setAdding(false)
                navigate({ to: '/ideas/$ideaId', params: { ideaId } })
              }}
            >
              <label htmlFor="new-idea" className="text-sm font-medium">
                Idea name
              </label>
              <input id="new-idea" autoFocus className="field" placeholder="e.g. Scheduling tool for dog groomers" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  Add
                </Button>
                <Button variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          <ul className="flex flex-col gap-2">
            {data.ideas.map((i) => {
              const signals = data.signals.filter((s) => s.ideaIds.includes(i.id))
              const evidence = signals.filter((s) => s.type !== 'noise').length
              const people = data.people.filter((p) => p.ideaIds.includes(i.id)).length
              return (
                <li key={i.id}>
                  <Link
                    to="/ideas/$ideaId"
                    params={{ ideaId: i.id }}
                    aria-current={i.id === ideaId ? 'page' : undefined}
                    className={clsx('block rounded-2xl border px-4 py-3', i.id === ideaId ? 'border-accent bg-soft' : 'border-rule bg-card hover:bg-soft/60')}
                  >
                    <span className="block font-medium">{i.name}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-ink-2">
                      <Badge tone={i.status === 'parked' ? 'neutral' : 'accent'}>{ideaStatusLabel[i.status]}</Badge>
                      {people} {people === 1 ? 'person' : 'people'} · {evidence} {evidence === 1 ? 'signal' : 'signals'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
