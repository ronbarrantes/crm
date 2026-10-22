import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import { requireOwner } from './lib'

// The public digital business card. Only `getBySlug`, `submitContact` and the vCard HTTP route
// (http.ts) are reachable without signing in, and none of them return CRM data.

const link = v.object({ label: v.string(), url: v.string() })

/** The fields anyone with the link can see. Never includes ownerId. */
async function publicCard(ctx: QueryCtx, card: Doc<'cards'>) {
  return {
    slug: card.slug,
    name: card.name,
    title: card.title,
    company: card.company,
    phone: card.phone,
    email: card.email,
    website: card.website,
    bio: card.bio,
    links: card.links,
    photoUrl: card.photoId ? ((await ctx.storage.getUrl(card.photoId)) ?? undefined) : undefined,
  }
}

export type PublicCard = Awaited<ReturnType<typeof publicCard>>

export async function cardBySlug(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query('cards')
    .withIndex('by_slug', (q) => q.eq('slug', slug.toLowerCase()))
    .unique()
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const card = await cardBySlug(ctx, slug)
    return card ? await publicCard(ctx, card) : null
  },
})

/** The signed-in owner's card, for the settings form. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    if (!(await ctx.auth.getUserIdentity())) return null
    const ownerId = await requireOwner(ctx)
    const card = await ctx.db
      .query('cards')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .first()
    return card ? { id: card._id, ...(await publicCard(ctx, card)) } : null
  },
})

const optionalText = (value: string | undefined, max: number, label: string) => {
  const trimmed = value?.trim() ?? ''
  if (trimmed.length > max) throw new ConvexError(`${label} is too long`)
  return trimmed || undefined
}

function safeUrl(url: string, label: string) {
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`
  try {
    const parsed = new URL(withScheme)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error()
    return parsed.toString()
  } catch {
    throw new ConvexError(`${label} isn't a valid link`)
  }
}

/** Create or replace the owner's card. */
export const update = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    bio: v.optional(v.string()),
    links: v.array(link),
    /** A new photo, or null to remove the current one. Omit to keep it. */
    photoId: v.optional(v.union(v.id('_storage'), v.null())),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const slug = args.slug.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug)) throw new ConvexError('Use 1–40 lowercase letters, numbers or dashes for the link name')
    const name = args.name.trim()
    if (!name || name.length > 100) throw new ConvexError('Add your name (up to 100 characters)')
    if (args.links.length > 10) throw new ConvexError('Up to 10 links')
    const website = optionalText(args.website, 300, 'Website')

    const existing = await ctx.db
      .query('cards')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .first()
    const taken = await cardBySlug(ctx, slug)
    if (taken && taken._id !== existing?._id) throw new ConvexError('That link name is taken')

    const fields = {
      ownerId,
      slug,
      name,
      title: optionalText(args.title, 100, 'Title'),
      company: optionalText(args.company, 100, 'Company'),
      phone: optionalText(args.phone, 40, 'Phone'),
      email: optionalText(args.email, 200, 'Email'),
      website: website ? safeUrl(website, 'Website') : undefined,
      bio: optionalText(args.bio, 500, 'Bio'),
      links: args.links
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.label || l.url)
        .map((l, i) => {
          if (!l.label || !l.url) throw new ConvexError(`Link ${i + 1} needs both a label and a URL`)
          if (l.label.length > 60) throw new ConvexError(`Link ${i + 1}'s label is too long`)
          return { label: l.label, url: safeUrl(l.url, `Link ${i + 1}`) }
        }),
    }

    const photoId = args.photoId === undefined ? existing?.photoId : (args.photoId ?? undefined)
    if (existing?.photoId && existing.photoId !== photoId) await ctx.storage.delete(existing.photoId)

    if (existing) {
      await ctx.db.replace(existing._id, { ...fields, photoId })
      return existing._id
    }
    return await ctx.db.insert('cards', { ...fields, photoId })
  },
})

const SUBMISSIONS_PER_HOUR = 30

const normEmail = (e?: string) => e?.trim().toLowerCase() || undefined
const normPhone = (p?: string) => p?.replace(/[^\d]/g, '').replace(/^1(?=\d{10}$)/, '') || undefined

/**
 * "Share your info back" from the public card page. Lands in the owner's Inbox for triage,
 * tagged as from the card. Someone already known (same email or phone) is updated and sent back
 * to the Inbox instead of being duplicated. Returns nothing about the owner's data.
 */
export const submitContact = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    note: v.optional(v.string()),
    event: v.optional(v.string()),
    /** Honeypot: a hidden field people never fill in. */
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const card = await cardBySlug(ctx, args.slug)
    if (!card) throw new ConvexError('Card not found')
    // Bots that fill every field get a normal-looking success and nothing is saved.
    if (args.website?.trim()) return { ok: true }

    const name = args.name.trim()
    if (!name || name.length > 100) throw new ConvexError('Add your name (up to 100 characters)')
    const email = optionalText(args.email, 200, 'Email')
    const phone = optionalText(args.phone, 40, 'Phone')
    if (!email && !phone) throw new ConvexError('Add an email or a phone number')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ConvexError('That email doesn’t look right')
    if (phone && (normPhone(phone)?.length ?? 0) < 7) throw new ConvexError('That phone number doesn’t look right')
    const company = optionalText(args.company, 100, 'Company')
    const note = optionalText(args.note, 500, 'Note')
    const sourceEvent = optionalText(args.event, 80, 'Event')

    // Rate limit per card. Convex mutations don't see the caller's IP, so this caps the total.
    const hourAgo = Date.now() - 60 * 60 * 1000
    const recent = await ctx.db
      .query('cardSubmissions')
      .withIndex('by_card', (q) => q.eq('cardId', card._id).gt('at', hourAgo))
      .take(SUBMISSIONS_PER_HOUR)
    if (recent.length >= SUBMISSIONS_PER_HOUR) throw new ConvexError('Lots of people are sharing right now. Please try again in a few minutes.')
    await ctx.db.insert('cardSubmissions', { cardId: card._id, at: Date.now() })

    const ownerId = card.ownerId
    const now = new Date()
    const people = await ctx.db
      .query('people')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect()
    const known = people.find(
      (p) => (email && normEmail(p.email) === normEmail(email)) || (phone && normPhone(p.phone) && normPhone(p.phone) === normPhone(phone)),
    )

    // Tag with the owner's event mode if it's running, as quick capture does.
    const events = await ctx.db
      .query('events')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect()
    const liveEvent = events.filter((e) => new Date(e.endsAt).getTime() > now.getTime()).sort((a, b) => b.date.localeCompare(a.date))[0]

    const hookLine = note ?? 'Shared their info from your card'
    if (known) {
      const line = `Shared their info from your card${sourceEvent ? ` (${sourceEvent})` : ''} on ${now.toISOString().slice(0, 10)}${
        name !== known.name ? ` as “${name}”` : ''
      }${note ? `: ${note}` : ''}`
      await ctx.db.patch(known._id, {
        email: known.email || email,
        phone: known.phone || phone,
        company: known.company || company,
        personalNotes: [known.personalNotes, line].filter(Boolean).join('\n'),
        needsTriage: true,
      })
      return { ok: true }
    }

    await ctx.db.insert('people', {
      ownerId,
      name,
      hookLine,
      email,
      phone,
      company,
      eventId: liveEvent?._id,
      stage: 'stranger',
      flags: [],
      ideaIds: [],
      metAt: now.toISOString(),
      needsTriage: true,
      source: 'card',
      sourceEvent,
    })
    return { ok: true }
  },
})

/** Upload URL for the card photo. */
export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})
