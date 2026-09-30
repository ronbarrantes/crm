import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ButtonLink, Card, ChipGroup, PageHeader } from '~/components/ui'

export const Route = createFileRoute('/settings')({ component: Settings })

type Theme = 'auto' | 'light' | 'dark'

function applyTheme(mode: Theme) {
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

function Settings() {
  const [theme, setTheme] = useState<Theme>('auto')

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
          <p className="mt-1 text-sm text-ink-2">Signed in as you. Account settings arrive with Clerk.</p>
          <ButtonLink to="/sign-in" className="mt-3">
            Sign out
          </ButtonLink>
        </Card>
        <p className="text-center text-xs text-ink-2">Preview build · sample data resets on refresh</p>
      </div>
    </div>
  )
}
