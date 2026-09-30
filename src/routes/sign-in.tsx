import { createFileRoute } from '@tanstack/react-router'
import { ButtonLink } from '~/components/ui'

// Placeholder until Clerk is wired up. Sign-in only; there is no sign-up.
export const Route = createFileRoute('/sign-in')({ component: SignIn })

function SignIn() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-rule bg-card p-6 text-center">
        <img src="/icon.svg" alt="" className="mx-auto size-12" />
        <h1 className="mt-4 text-2xl">Fieldnotes</h1>
        <p className="mt-1 text-ink-2">Remember people and what you learned from them.</p>
        <ButtonLink to="/" variant="primary" className="mt-6 w-full">
          Sign in
        </ButtonLink>
        <p className="mt-3 text-xs text-ink-2">Private. Invite only for now.</p>
      </div>
    </main>
  )
}
