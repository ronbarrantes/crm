import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { own, requireOwner } from './lib'
import { honesty, meetingQuestion, meetingType, nextStepType, signalType } from './schema'

const emptyHonesty = { gotFacts: null, pitchedTooEarly: null, theyPitchedMe: null }

export const plan = mutation({
  args: {
    personId: v.id('people'),
    at: v.string(),
    type: meetingType,
    intent: v.string(),
    questions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    await own(ctx, ownerId, args.personId)
    return await ctx.db.insert('meetings', {
      ownerId,
      personId: args.personId,
      status: 'planned',
      at: args.at,
      type: args.type,
      intent: args.intent.trim(),
      questions: args.questions
        .map((q) => q.trim())
        .filter(Boolean)
        .map((text) => ({ text, progress: 'not-asked' as const, note: '' })),
      takeaways: [],
      honesty: emptyHonesty,
      notes: '',
    })
  },
})

export const saveDebrief = mutation({
  args: {
    meetingId: v.id('meetings'),
    questions: v.array(meetingQuestion),
    takeaways: v.array(v.string()),
    signals: v.array(v.object({ type: signalType, text: v.string(), ideaIds: v.array(v.id('ideas')) })),
    honesty,
    nextStep: v.object({
      type: nextStepType,
      description: v.string(),
      owner: v.union(v.literal('me'), v.literal('them')),
      dueAt: v.optional(v.string()),
    }),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx)
    const meeting = await own(ctx, ownerId, args.meetingId)
    const person = await own(ctx, ownerId, meeting.personId)
    const takeaways = args.takeaways.map((t) => t.trim()).filter(Boolean)
    if (takeaways.length === 0) throw new Error('Add at least one takeaway')

    await ctx.db.patch(meeting._id, {
      status: 'debriefed',
      questions: args.questions,
      takeaways,
      honesty: args.honesty,
      notes: args.notes.trim(),
    })
    for (const s of args.signals) {
      for (const ideaId of s.ideaIds) await own(ctx, ownerId, ideaId)
      await ctx.db.insert('signals', { ownerId, meetingId: meeting._id, personId: person._id, type: s.type, text: s.text.trim(), ideaIds: s.ideaIds })
    }
    await ctx.db.insert('nextSteps', {
      ownerId,
      meetingId: meeting._id,
      personId: person._id,
      ...args.nextStep,
      description: args.nextStep.description.trim(),
      done: args.nextStep.type === 'none',
    })
    if (args.honesty.theyPitchedMe && !person.flags.includes('pitching-me')) {
      await ctx.db.patch(person._id, { flags: [...person.flags, 'pitching-me'] })
    }
  },
})

/** A planned meeting that never happened. */
export const remove = mutation({
  args: { id: v.id('meetings') },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx)
    const meeting = await own(ctx, ownerId, id)
    if (meeting.status !== 'planned') throw new Error('Only planned meetings can be deleted')
    await ctx.db.delete(id)
  },
})

export const toggleNextStep = mutation({
  args: { id: v.id('nextSteps') },
  handler: async (ctx, { id }) => {
    const ownerId = await requireOwner(ctx)
    const step = await own(ctx, ownerId, id)
    await ctx.db.patch(id, { done: !step.done })
  },
})
