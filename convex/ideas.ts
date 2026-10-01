import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { own, requireOwner } from './lib'
import { ideaStatus } from './schema'

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const ownerId = await requireOwner(ctx)
    return await ctx.db.insert('ideas', { ownerId, name: name.trim(), description: '', status: 'exploring', keyQuestions: [] })
  },
})

export const update = mutation({
  args: {
    id: v.id('ideas'),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(ideaStatus),
      keyQuestions: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const ownerId = await requireOwner(ctx)
    await own(ctx, ownerId, id)
    await ctx.db.patch(id, patch)
  },
})

export const addBelief = mutation({
  args: { ideaId: v.id('ideas'), statement: v.string() },
  handler: async (ctx, { ideaId, statement }) => {
    const ownerId = await requireOwner(ctx)
    await own(ctx, ownerId, ideaId)
    return await ctx.db.insert('beliefs', { ownerId, ideaId, statement: statement.trim() })
  },
})

export const removeBelief = mutation({
  args: { id: v.id('beliefs') },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx)
    await own(ctx, ownerId, id)
    await ctx.db.delete(id)
  },
})
