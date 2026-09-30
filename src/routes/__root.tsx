import { HeadContent, Link, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AppShell } from '~/components/app-shell'
import appCss from '~/styles.css?url'

// Applies the saved theme (auto / light / dark) before paint to avoid a flash.
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('theme');if(m!=='light'&&m!=='dark')m='auto';var d=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'}catch(e){}})()`

export const Route = createRootRoute({
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
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const bare = useRouterState({ select: (s) => s.location.pathname === '/sign-in' })
  if (bare) return <Outlet />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
