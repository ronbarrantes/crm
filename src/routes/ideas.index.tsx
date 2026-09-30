import { createFileRoute } from '@tanstack/react-router'
import { Card } from '~/components/ui'

export const Route = createFileRoute('/ideas/')({
  component: () => <Card className="hidden min-h-64 place-items-center p-10 text-ink-2 lg:grid">Pick an idea to see its evidence.</Card>,
})
