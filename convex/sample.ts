import { mutation } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireOwner } from './lib'
import { createSampleData } from '../src/lib/sample-data'

/** Whether this deployment allows loading the fictional sample data. Only the dev deployment sets this. */
function sampleAllowed() {
  return process.env.ALLOW_SAMPLE_DATA === 'true'
}

/** Copies the fictional sample data (PLAN.md §14) into the caller's account. Dev deployment only. */
export const load = mutation({
  args: {},
  handler: async (ctx) => {
    if (!sampleAllowed()) throw new Error('Sample data is disabled on this deployment')
    const ownerId = await requireOwner(ctx)
    const d = createSampleData()

    const events = new Map<string, Id<'events'>>()
    for (const { id, ...e } of d.events) events.set(id, await ctx.db.insert('events', { ownerId, ...e }))
    const ideas = new Map<string, Id<'ideas'>>()
    for (const { id, ...i } of d.ideas) ideas.set(id, await ctx.db.insert('ideas', { ownerId, ...i }))
    for (const { id: _id, ideaId, ...b } of d.beliefs) await ctx.db.insert('beliefs', { ownerId, ...b, ideaId: ideas.get(ideaId)! })

    const people = new Map<string, Id<'people'>>()
    for (const { id, photoUrl: _p, eventId, ideaIds, ...p } of d.people) {
      people.set(
        id,
        await ctx.db.insert('people', {
          ownerId,
          ...p,
          eventId: eventId ? events.get(eventId) : undefined,
          ideaIds: ideaIds.map((i) => ideas.get(i)!),
        }),
      )
    }
    const meetings = new Map<string, Id<'meetings'>>()
    for (const { id, personId, ...m } of d.meetings) meetings.set(id, await ctx.db.insert('meetings', { ownerId, ...m, personId: people.get(personId)! }))
    for (const { id: _id, meetingId, personId, ideaIds, ...s } of d.signals) {
      await ctx.db.insert('signals', {
        ownerId,
        ...s,
        meetingId: meetings.get(meetingId)!,
        personId: people.get(personId)!,
        ideaIds: ideaIds.map((i) => ideas.get(i)!),
      })
    }
    for (const { id: _id, meetingId, personId, ...n } of d.nextSteps) {
      await ctx.db.insert('nextSteps', { ownerId, ...n, meetingId: meetings.get(meetingId)!, personId: people.get(personId)! })
    }
  },
})

/** Deletes everything the caller owns. Dev deployment only, for starting over. */
export const clearMine = mutation({
  args: {},
  handler: async (ctx) => {
    if (!sampleAllowed()) throw new Error('Clearing data is disabled on this deployment')
    const ownerId = await requireOwner(ctx)
    for (const table of ['nextSteps', 'signals', 'meetings', 'beliefs', 'people', 'ideas', 'events'] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
        .collect()
      for (const row of rows) {
        if (table === 'people' && 'photoId' in row && row.photoId) await ctx.storage.delete(row.photoId)
        await ctx.db.delete(row._id)
      }
    }
  },
})
