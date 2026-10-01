import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import { HeadContent, Link, Outlet, Scripts, createRootRoute, redirect, useRouterState } from '@tanstack/react-router'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { ReactNode } from 'react'
import { AppShell } from '~/components/app-shell'
import { fetchAuth } from '~/lib/auth'
import { convex } from '~/lib/convex'
import { useIsDark } from '~/lib/use-is-dark'
import appCss from '~/styles.css?url'

const isSignIn = (path: string) => path === '/sign-in' || path.startsWith('/sign-in/')

// Applies the saved theme (auto / light / dark) before paint to avoid a flash.
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('theme');if(m!=='light'&&m!=='dark')m='auto';var d=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'}catch(e){}})()`

export const Route = createRootRoute({
  // Everything except the sign-in page needs a signed-in user.
  beforeLoad: async ({ location }) => {
    const { userId } = await fetchAuth()
    if (!userId && !isSignIn(location.pathname)) {
      throw redirect({ to: '/sign-in/$', params: { _splat: '' }, search: { redirect_url: location.href } as never })
    }
    return { userId }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#fbfaf8', media: '(prefers-color-scheme: light)' },
      { name: 'theme-color', content: '#0e0d13', media: '(prefers-color-scheme: dark)' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Fieldnotes' },
      { title: 'Fieldnotes' },
    ],
    links: [
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
      { rel: 'apple-touch-icon', href: '/icon.svg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@75..125,200..900&display=swap' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl">Not found</h1>
      <p className="mt-2 text-ink-2">That page doesn’t exist.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-accent underline underline-offset-4">
        Back to Today
      </Link>
    </div>
  ),
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="antialiased [overflow-wrap:anywhere]">
        <ClerkProvider signInUrl="/sign-in" appearance={useClerkAppearance()}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
          </ConvexProviderWithClerk>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const bare = useRouterState({ select: (s) => isSignIn(s.location.pathname) })
  if (bare) return <Outlet />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

// Clerk derives hover and border shades itself, so it needs real colors, not CSS variables.
const clerkColors = {
  light: { primary: '#5130d8', onPrimary: '#ffffff', ink: '#111015', ink2: '#5a5764', card: '#ffffff', rule: '#cfcad9', danger: '#b4232f' },
  dark: { primary: '#b6a2ff', onPrimary: '#0e0d13', ink: '#f2eff8', ink2: '#aaa4b9', card: '#16141d', rule: '#3a3744', danger: '#ff8a93' },
}

function useClerkAppearance() {
  const c = clerkColors[useIsDark() ? 'dark' : 'light']
  return {
    variables: {
      colorPrimary: c.primary,
      colorPrimaryForeground: c.onPrimary,
      colorForeground: c.ink,
      colorMutedForeground: c.ink2,
      colorBackground: c.card,
      colorInput: c.card,
      colorInputForeground: c.ink,
      colorBorder: c.rule,
      colorDanger: c.danger,
      fontFamily: "'Mona Sans', ui-sans-serif, system-ui, sans-serif",
      borderRadius: '10px',
    },
    elements: { footerAction: { display: 'none' } },
  }
}
