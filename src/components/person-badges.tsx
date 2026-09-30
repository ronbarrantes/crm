import { Badge } from './ui'
import { progressFor, useData } from '~/lib/store'
import { flagLabel, nextStepLabel, stageLabel } from '~/lib/vocab'
import type { Person } from '~/lib/types'

export function PersonBadges({ person }: { person: Person }) {
  const data = useData()
  const progress = progressFor(data, person.id)
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge>{stageLabel[person.stage]}</Badge>
      {progress !== 'none' && <Badge tone="ok">Progress: {nextStepLabel[progress]}</Badge>}
      {person.flags.map((f) => (
        <Badge key={f} tone={f === 'great-connector' ? 'accent' : 'warn'}>
          {flagLabel[f]}
        </Badge>
      ))}
    </div>
  )
}
