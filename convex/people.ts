import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { own, requireOwner } from './lib'
import { flag, stage } from './schema'

/** Quick capture: creates a person that needs triage, tagged with the active event if any. */
export const capture = mutation({
  args: {
    name: v.string(),
    hookLine: v.string(),
    photoId: v.optional(v.id('_storage')),
    eventId: v.optional(v.id('events')),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    if (args.eventId) await own(ctx, ownerId, args.eventId)
    return await ctx.db.insert('people', {
      ownerId,
      name: args.name.trim(),
      hookLine: args.hookLine.trim(),
      photoId: args.photoId,
      eventId: args.eventId,
      stage: 'stranger',
      flags: [],
      ideaIds: [],
      metAt: new Date().toISOString(),
      needsTriage: true,
      source: 'capture',
    })
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

/** Fold a fresh capture into someone already known, then delete the duplicate. */
export const merge = mutation({
  args: { duplicateId: v.id('people'), targetId: v.id('people') },
  handler: async (ctx, { duplicateId, targetId }) => {
    const ownerId = await requireOwner(ctx)
    const dup = await own(ctx, ownerId, duplicateId)
    const target = await own(ctx, ownerId, targetId)
    if (dup._id === target._id) throw new Error('Cannot merge a person into themselves')

    const personalNotes = [target.personalNotes, `Also noted: ${dup.hookLine}`].filter(Boolean).join('\n')
    await ctx.db.patch(targetId, {
      personalNotes,
      photoId: target.photoId ?? dup.photoId,
      ideaIds: [...new Set([...target.ideaIds, ...dup.ideaIds])],
    })
    // Anything already hanging off the duplicate moves to the target.
    for (const table of ['meetings', 'signals', 'nextSteps'] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex('by_person', (q) => q.eq('personId', duplicateId))
        .collect()
      for (const row of rows) await ctx.db.patch(row._id, { personId: targetId })
    }
    if (dup.photoId && target.photoId) await ctx.storage.delete(dup.photoId)
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
