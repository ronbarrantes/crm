import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'
import { own, requireOwner } from './lib'
import { flag, stage } from './schema'

/** Quick capture: creates a person that needs triage, tagged with the event if it is still running. */
export const capture = mutation({
  args: {
    name: v.string(),
    hookLine: v.string(),
    photoId: v.optional(v.id('_storage')),
    eventId: v.optional(v.id('events')),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    // A client left open past midnight can still send yesterday's event; don't tag with it.
    const event = args.eventId ? await own(ctx, ownerId, args.eventId) : null
    const eventStillOn = event !== null && new Date(event.endsAt).getTime() > Date.now()
    const personId = await ctx.db.insert('people', {
      ownerId,
      name: args.name.trim(),
      hookLine: args.hookLine.trim(),
      photoId: args.photoId,
      eventId: eventStillOn ? event._id : undefined,
      stage: 'stranger',
      flags: [],
      ideaIds: [],
      metAt: new Date().toISOString(),
      needsTriage: true,
      source: 'capture',
    })
    return { personId, eventDropped: event !== null && !eventStillOn }
  },
})

export const update = mutation({
  args: {
    id: v.id('people'),
    patch: v.object({
      name: v.optional(v.string()),
      role: v.optional(v.string()),
      company: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      personalNotes: v.optional(v.string()),
      stage: v.optional(stage),
      flags: v.optional(v.array(flag)),
      ideaIds: v.optional(v.array(v.id('ideas'))),
      needsTriage: v.optional(v.boolean()),
      // null clears the follow-up
      followUpAt: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const ownerId = await requireOwner(ctx)
    await own(ctx, ownerId, id)
    for (const ideaId of patch.ideaIds ?? []) await own(ctx, ownerId, ideaId)
    const { followUpAt, ...rest } = patch
    await ctx.db.patch(id, { ...rest, ...(followUpAt !== undefined ? { followUpAt: followUpAt ?? undefined } : {}) })
  },
})

const contactFields = ['role', 'company', 'email', 'phone', 'introducedBy'] as const
const choice = v.union(v.literal('existing'), v.literal('new'))
const stageRank = { stranger: 0, acquaintance: 1, contact: 2, friend: 3 } as const

/**
 * Fold a fresh capture into someone already known, then delete the duplicate.
 * Missing contact fields are filled in, notes and flags from both are kept, and the new encounter
 * is recorded in the notes. Conflicting contact values and photos need an explicit choice.
 * `edits` carries the triage form's unsaved values for the duplicate.
 */
export const merge = mutation({
  args: {
    duplicateId: v.id('people'),
    targetId: v.id('people'),
    /** When the duplicate was met, formatted in the user's own time zone (the server only knows UTC). */
    metOn: v.string(),
    edits: v.object({
      role: v.optional(v.string()),
      company: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      personalNotes: v.optional(v.string()),
      ideaIds: v.optional(v.array(v.id('ideas'))),
      followUpAt: v.optional(v.string()),
    }),
    choices: v.object({
      role: v.optional(choice),
      company: v.optional(choice),
      email: v.optional(choice),
      phone: v.optional(choice),
      introducedBy: v.optional(choice),
      photo: v.optional(choice),
    }),
  },
  handler: async (ctx, { duplicateId, targetId, metOn, edits, choices }) => {
    const ownerId = await requireOwner(ctx)
    const dup = await own(ctx, ownerId, duplicateId)
    const target = await own(ctx, ownerId, targetId)
    if (dup._id === target._id) throw new ConvexError('Cannot merge a person into themselves')
    for (const ideaId of edits.ideaIds ?? []) await own(ctx, ownerId, ideaId)

    const incoming = { ...dup, ...Object.fromEntries(Object.entries(edits).filter(([, val]) => val !== undefined && val !== '')) }
    const patch: Partial<typeof target> = {}

    for (const field of contactFields) {
      const existing = target[field]?.trim()
      const fresh = (incoming[field] as string | undefined)?.trim()
      if (!fresh || fresh === existing) continue
      if (!existing) patch[field] = fresh
      else if (!choices[field]) throw new ConvexError(`Choose which ${field} to keep`)
      else if (choices[field] === 'new') patch[field] = fresh
    }

    if (target.photoId && dup.photoId) {
      if (!choices.photo) throw new ConvexError('Choose which photo to keep')
      if (choices.photo === 'new') {
        patch.photoId = dup.photoId
        await ctx.storage.delete(target.photoId)
      } else {
        await ctx.storage.delete(dup.photoId)
      }
    } else if (!target.photoId && dup.photoId) {
      patch.photoId = dup.photoId
    }

    const event = dup.eventId ? await ctx.db.get(dup.eventId) : null
    const metAgain = `Met again${event ? ` at ${event.name}` : ''} on ${metOn}: ${dup.hookLine}`
    patch.personalNotes = [target.personalNotes, incoming.personalNotes, metAgain].filter(Boolean).join('\n')
    patch.flags = [...new Set([...target.flags, ...dup.flags])]
    patch.ideaIds = [...new Set([...target.ideaIds, ...dup.ideaIds, ...(edits.ideaIds ?? [])])]
    if (stageRank[dup.stage] > stageRank[target.stage]) patch.stage = dup.stage
    const followUps = [target.followUpAt, incoming.followUpAt].filter((f): f is string => !!f).sort()
    if (followUps[0]) patch.followUpAt = followUps[0]

    await ctx.db.patch(targetId, patch)
    // Anything already hanging off the duplicate moves to the target.
    for (const table of ['meetings', 'signals', 'nextSteps'] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex('by_person', (q) => q.eq('personId', duplicateId))
        .collect()
      for (const row of rows) await ctx.db.patch(row._id, { personId: targetId })
    }
    await ctx.db.delete(duplicateId)
  },
})

export const remove = mutation({
  args: { id: v.id('people') },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx)
    const person = await own(ctx, ownerId, id)
    for (const table of ['meetings', 'signals', 'nextSteps'] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex('by_person', (q) => q.eq('personId', id))
        .collect()
      for (const row of rows) await ctx.db.delete(row._id)
    }
    if (person.photoId) await ctx.storage.delete(person.photoId)
    await ctx.db.delete(id)
  },
})

/** Upload URL for a capture photo. The client compresses the image before uploading. */
export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})
