import { Link, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'
import { Home, Inbox, Lightbulb, Plus, Settings, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { activeEvent, inbox, useData } from '~/lib/store'

const nav = [
  { to: '/', label: 'Today', icon: Home, exact: true },
  { to: '/people', label: 'People', icon: Users },
  { to: '/capture', label: 'Capture', icon: Plus, primary: true },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
] as const

function useIsActive() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (to: string, exact?: boolean) => (exact ? path === to : path === to || path.startsWith(`${to}/`))
}

export function AppShell({ children }: { children: ReactNode }) {
  const data = useData()
  const isActive = useIsActive()
  const inboxCount = inbox(data).length
  const event = activeEvent(data)

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule px-3 py-5 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-3 text-[1.05rem] font-semibold">
          <img src="/icon.svg" alt="" className="size-7" />
          Fieldnotes
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, ...rest }) => {
            const active = isActive(to, 'exact' in rest)
            if ('primary' in rest) {
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className="mb-2 flex min-h-11 items-center gap-3 rounded-[10px] bg-accent px-3 font-medium text-on-accent hover:bg-accent-hover"
                >
                  <Icon aria-hidden className="size-5" />
                  {label}
                </Link>
              )
            }
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex min-h-11 items-center gap-3 rounded-[10px] px-3 font-medium',
                  active ? 'bg-soft text-on-soft' : 'text-ink-2 hover:bg-soft hover:text-on-soft',
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
                {to === '/inbox' && inboxCount > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-2 text-xs leading-5 text-on-accent">
                    {inboxCount}
                    <span className="sr-only"> to triage</span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        {event && (
          <p className="mt-6 rounded-xl border border-rule bg-card p-3 text-sm">
            <span className="label block">Event mode</span>
            {event.name}
          </p>
        )}
        <Link
          to="/settings"
          aria-current={isActive('/settings') ? 'page' : undefined}
          className={clsx(
            'mt-auto flex min-h-11 items-center gap-3 rounded-[10px] px-3 font-medium',
            isActive('/settings') ? 'bg-soft text-on-soft' : 'text-ink-2 hover:bg-soft hover:text-on-soft',
          )}
        >
          <Settings aria-hidden className="size-5" />
          Settings
        </Link>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-rule bg-paper/90 px-4 py-2 backdrop-blur lg:hidden">
        <Link to="/" className="flex min-h-11 items-center gap-2 font-semibold">
          <img src="/icon.svg" alt="" className="size-6" />
          Fieldnotes
        </Link>
        <Link to="/settings" className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-soft" aria-label="Settings">
          <Settings aria-hidden className="size-5" />
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="min-w-0 px-4 pt-5 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {nav.map(({ to, label, icon: Icon, ...rest }) => {
            const active = isActive(to, 'exact' in rest)
            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium',
                    active ? 'text-accent' : 'text-ink-2',
                  )}
                >
                  {'primary' in rest ? (
                    <span className="-mt-5 grid size-14 place-items-center rounded-full bg-accent text-on-accent shadow-[0_4px_14px_rgba(81,48,216,0.35)]">
                      <Icon aria-hidden className="size-7" />
                    </span>
                  ) : (
                    <Icon aria-hidden className="size-6" />
                  )}
                  {label}
                  {to === '/inbox' && inboxCount > 0 && (
                    <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-accent px-1.5 text-[0.65rem] leading-4 text-on-accent">
                      {inboxCount}
                      <span className="sr-only"> to triage</span>
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
