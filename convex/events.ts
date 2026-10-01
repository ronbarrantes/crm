import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { own, requireOwner } from './lib'

/** Event mode. The client passes endsAt (midnight in the user's own time zone). */
export const start = mutation({
  args: { name: v.string(), place: v.string(), endsAt: v.string() },
  handler: async (ctx, { name, place, endsAt }) => {
    const ownerId = await requireOwner(ctx)
    return await ctx.db.insert('events', { ownerId, name: name.trim(), place: place.trim(), date: new Date().toISOString(), endsAt })
  },
})

export const end = mutation({
  args: { id: v.id('events') },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx)
    await own(ctx, ownerId, id)
    await ctx.db.patch(id, { endsAt: new Date().toISOString() })
  },
})
