import { query } from './_generated/server'
import { requireOwner } from './lib'

/**
 * Everything the signed-in user owns, in the shape the screens use (`id` instead of `_id`).
 * One query keeps the client simple; a personal CRM stays small enough for this.
 */
export const all = query({
  args: {},
  handler: async (ctx) => {
    // Signed out (or the token hasn't arrived yet): nothing to show.
    if (!(await ctx.auth.getUserIdentity())) return null
    const ownerId = await requireOwner(ctx)
    const [events, people, meetings, signals, ideas, beliefs, nextSteps] = await Promise.all([
      ctx.db.query('events').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
      ctx.db.query('people').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
      ctx.db.query('meetings').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
      ctx.db.query('signals').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
      ctx.db.query('ideas').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
      ctx.db.query('beliefs').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
      ctx.db.query('nextSteps').withIndex('by_owner', (q) => q.eq('ownerId', ownerId)).collect(),
    ])

    const strip = <D extends { _id: string; _creationTime: number; ownerId: string }>({ _id, _creationTime, ownerId: _o, ...rest }: D) => ({
      id: _id as D['_id'],
      createdAt: _creationTime,
      ...rest,
    })

    return {
      events: events.map(strip),
      people: await Promise.all(
        people.map(async (p) => {
          const { photoId, ...rest } = strip(p)
          return { ...rest, photoUrl: photoId ? ((await ctx.storage.getUrl(photoId)) ?? undefined) : undefined }
        }),
      ),
      meetings: meetings.map(strip),
      signals: signals.map(strip),
      ideas: ideas.sort((a, b) => a._creationTime - b._creationTime).map(strip),
      beliefs: beliefs.map(strip),
      nextSteps: nextSteps.map(strip),
    }
  },
})
