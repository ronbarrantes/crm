import { createFileRoute, notFound } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import { ConvexError } from 'convex/values'
import { Check, Globe, Link as LinkIcon, Mail, Phone, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { Button, Field } from '~/components/ui'
import { convex, convexSiteUrl } from '~/lib/convex'
import { initials } from '~/lib/format'

// The public digital business card. The root route lets /c/* through without signing in.

export const Route = createFileRoute('/c/$slug')({
  validateSearch: (search: Record<string, unknown>): { event?: string } =>
    typeof search.event === 'string' && search.event ? { event: search.event.slice(0, 80) } : {},
  loader: async ({ params }) => {
    // A plain HTTP query so the card (and its link preview tags) render on the server.
    const card = await new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string).query(api.card.getBySlug, { slug: params.slug })
    if (!card) throw notFound()
    return card
  },
  head: ({ loaderData: card }) => {
    if (!card) return {}
    const title = card.name
    const description = [card.title, card.company].filter(Boolean).join(' · ') || card.bio || `${card.name}’s contact card`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:type', content: 'profile' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        ...(card.photoUrl ? [{ property: 'og:image', content: card.photoUrl }] : []),
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    }
  },
  component: CardPage,
  notFoundComponent: () => (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <p className="text-ink-2">This card doesn’t exist.</p>
    </main>
  ),
})

function CardPage() {
  const card = Route.useLoaderData()
  const { event } = Route.useSearch()
  const vcardUrl = `${convexSiteUrl}/vcard/${encodeURIComponent(card.slug)}`
  const subtitle = [card.title, card.company].filter(Boolean).join(' · ')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <section className="flex flex-col items-center text-center">
        {card.photoUrl ? (
          <img src={card.photoUrl} alt="" className="size-32 border border-rule object-cover" />
        ) : (
          <span aria-hidden className="grid size-32 place-items-center bg-soft text-4xl font-semibold text-on-soft">
            {initials(card.name)}
          </span>
        )}
        <h1 className="mt-4 text-[1.75rem] leading-tight">{card.name}</h1>
        {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}
        {card.bio && <p className="mt-3 whitespace-pre-line">{card.bio}</p>}
      </section>

      <a
        href={vcardUrl}
        className="inline-flex min-h-13 items-center justify-center gap-2 bg-accent px-4 text-[1.05rem] font-medium text-on-accent hover:bg-accent-hover"
      >
        <UserPlus aria-hidden className="size-5" />
        Save contact
      </a>

      <ul className="flex flex-col gap-2">
        {card.phone && <CardLink href={`tel:${card.phone.replace(/[^\d+]/g, '')}`} icon={<Phone aria-hidden className="size-5" />} label="Call or text" detail={card.phone} />}
        {card.email && <CardLink href={`mailto:${card.email}`} icon={<Mail aria-hidden className="size-5" />} label="Email" detail={card.email} />}
        {card.website && <CardLink href={card.website} icon={<Globe aria-hidden className="size-5" />} label="Website" detail={card.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} />}
        {card.links.map((l) => (
          <CardLink key={l.url} href={l.url} icon={<LinkIcon aria-hidden className="size-5" />} label={l.label} detail={l.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} />
        ))}
      </ul>

      <ShareBack slug={card.slug} firstName={card.name.split(/\s+/)[0]} event={event} />
    </main>
  )
}

function CardLink({ href, icon, label, detail }: { href: string; icon: React.ReactNode; label: string; detail: string }) {
  const external = href.startsWith('http')
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="flex min-h-14 items-center gap-3 border border-rule bg-card px-4 py-2 hover:bg-soft"
      >
        <span className="text-accent">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          <span className="block truncate text-sm text-ink-2">{detail}</span>
        </span>
      </a>
    </li>
  )
}

function ShareBack({ slug, firstName, event }: { slug: string; firstName: string; event?: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', note: '', website: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    if (!form.name.trim()) return setError('Add your name.')
    if (!form.email.trim() && !form.phone.trim()) return setError('Add an email or a phone number so I can reach you.')
    setSending(true)
    setError('')
    try {
      await convex.mutation(api.card.submitContact, { slug, ...form, event })
      setSent(true)
    } catch (err) {
      setError(err instanceof ConvexError ? String(err.data) : 'Couldn’t send that. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <section className="border border-rule bg-card p-5 text-center" role="status">
        <Check aria-hidden className="mx-auto size-8 text-ok" />
        <h2 className="mt-2 text-lg">Thanks, {form.name.trim().split(/\s+/)[0]}!</h2>
        <p className="mt-1 text-ink-2">Got it. I’ll be in touch.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="share-back" className="border border-rule bg-card p-4 sm:p-5">
      <h2 id="share-back" className="text-lg">
        Share your info with {firstName}
      </h2>
      <p className="mt-1 text-sm text-ink-2">So I can follow up. Only I see this.</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3" noValidate>
        <Field label="Name" htmlFor="sb-name">
          <input id="sb-name" className="field" autoComplete="name" maxLength={100} required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email" htmlFor="sb-email">
          <input id="sb-email" type="email" className="field" autoComplete="email" maxLength={200} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Phone" htmlFor="sb-phone" hint="Email or phone, whichever you prefer.">
          <input id="sb-phone" type="tel" className="field" autoComplete="tel" maxLength={40} value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Company (optional)" htmlFor="sb-company">
          <input id="sb-company" className="field" autoComplete="organization" maxLength={100} value={form.company} onChange={set('company')} />
        </Field>
        <Field label="Note (optional)" htmlFor="sb-note" hint="What we talked about, or what you’re working on.">
          <textarea id="sb-note" className="field min-h-20" maxLength={500} value={form.note} onChange={set('note')} />
        </Field>
        {/* Honeypot: hidden from people and screen readers; bots tend to fill it in. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="sb-website">Website</label>
          <input id="sb-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={sending}>
          {sending ? 'Sending…' : 'Send my info'}
        </Button>
      </form>
    </section>
  )
}
