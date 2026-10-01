import { SignOutButton, useUser } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button, Card, ChipGroup, PageHeader } from '~/components/ui'
import { clearMyData, loadSampleData, useData } from '~/lib/store'

export const Route = createFileRoute('/settings')({ component: Settings })

type Theme = 'auto' | 'light' | 'dark'

function applyTheme(mode: Theme) {
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

function Settings() {
  const [theme, setTheme] = useState<Theme>('auto')
  const { user } = useUser()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    } catch {
      // storage unavailable; stay on auto
    }
  }, [])

  function choose(mode: Theme) {
    setTheme(mode)
    applyTheme(mode)
    try {
      localStorage.setItem('theme', mode)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-4">
        <Card className="p-4 sm:p-5">
          <ChipGroup
            legend="Appearance"
            options={[
              { value: 'auto', label: 'Match system' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={theme}
            onChange={choose}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="text-[0.95rem]">Account</h2>
          <p className="mt-1 text-sm text-ink-2">Signed in as {user?.primaryEmailAddress?.emailAddress ?? '…'}</p>
          <SignOutButton redirectUrl="/sign-in">
            <Button className="mt-3">Sign out</Button>
          </SignOutButton>
        </Card>
        {import.meta.env.VITE_SAMPLE_DATA === 'true' && <SampleData />}
      </div>
    </div>
  )
}

/** Development only: fill an empty account with the fictional sample data, or wipe it. */
function SampleData() {
  const data = useData()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const empty = data.people.length === 0 && data.ideas.length === 0

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action()
      setMessage(done)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-dashed p-4 sm:p-5">
      <h2 className="text-[0.95rem]">Development data</h2>
      <p className="mt-1 text-sm text-ink-2">Only on the dev site. Uses fictional people from the plan.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy || !empty} onClick={() => run(loadSampleData, 'Sample data loaded.')}>
          Load sample data
        </Button>
        <Button
          variant="danger"
          disabled={busy || empty}
          onClick={() => {
            if (confirm('Delete everything in this dev account?')) run(clearMyData, 'All data cleared.')
          }}
        >
          Clear my data
        </Button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-ink-2">
        {message}
      </p>
    </Card>
  )
}
