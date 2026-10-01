import type { Id, TableNames } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

/** The signed-in user's id. Every row is stamped with it and every read is filtered by it. */
export async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not signed in')
  return identity.tokenIdentifier
}

/** Load a row and make sure it belongs to the caller. Missing and foreign rows look the same. */
export async function own<T extends TableNames>(ctx: QueryCtx | MutationCtx, ownerId: string, id: Id<T>) {
  const doc = await ctx.db.get(id)
  if (!doc || (doc as { ownerId?: string }).ownerId !== ownerId) throw new Error('Not found')
  return doc
}
