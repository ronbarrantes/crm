import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

// Sign-in only. Sign-up is restricted in Clerk, and the sign-up link is hidden.
export const Route = createFileRoute('/sign-in/$')({ component: SignInPage })

function SignInPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <img src="/icon.svg" alt="" className="mx-auto size-12" />
          <h1 className="mt-3 text-2xl">Fieldnotes</h1>
          <p className="mt-1 text-ink-2">Remember people and what you learned from them.</p>
        </div>
        <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/" />
      </div>
    </main>
  )
}
