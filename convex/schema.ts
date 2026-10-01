import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Phase 1 data model (PLAN.md §9). Every row belongs to one owner: the Clerk user's tokenIdentifier.

export const stage = v.union(v.literal('stranger'), v.literal('acquaintance'), v.literal('contact'), v.literal('friend'))
export const flag = v.union(v.literal('pitching-me'), v.literal('not-a-fit'), v.literal('great-connector'))
export const nextStepType = v.union(v.literal('none'), v.literal('time'), v.literal('introduction'), v.literal('money'))
export const ideaStatus = v.union(v.literal('exploring'), v.literal('building-evidence'), v.literal('committed'), v.literal('parked'))
export const meetingType = v.union(v.literal('event'), v.literal('coffee'), v.literal('call'), v.literal('demo'))
export const questionProgress = v.union(v.literal('answered'), v.literal('partly'), v.literal('not-asked'))
export const signalType = v.union(
  v.literal('problem'),
  v.literal('goal'),
  v.literal('obstacle'),
  v.literal('workaround'),
  v.literal('money'),
  v.literal('context'),
  v.literal('emotion'),
  v.literal('request'),
  v.literal('mention'),
  v.literal('noise'),
)
export const meetingQuestion = v.object({ text: v.string(), progress: questionProgress, note: v.string() })
export const honesty = v.object({
  gotFacts: v.union(v.boolean(), v.null()),
  pitchedTooEarly: v.union(v.boolean(), v.null()),
  theyPitchedMe: v.union(v.boolean(), v.null()),
})

export default defineSchema({
  events: defineTable({
    ownerId: v.string(),
    name: v.string(),
    place: v.string(),
    date: v.string(),
    endsAt: v.string(),
  }).index('by_owner', ['ownerId']),

  people: defineTable({
    ownerId: v.string(),
    name: v.string(),
    hookLine: v.string(),
    photoId: v.optional(v.id('_storage')),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    personalNotes: v.optional(v.string()),
    stage,
    flags: v.array(flag),
    ideaIds: v.array(v.id('ideas')),
    eventId: v.optional(v.id('events')),
    metAt: v.string(),
    introducedBy: v.optional(v.string()),
    needsTriage: v.boolean(),
    followUpAt: v.optional(v.string()),
    source: v.union(v.literal('capture'), v.literal('manual')),
  }).index('by_owner', ['ownerId']),

  meetings: defineTable({
    ownerId: v.string(),
    personId: v.id('people'),
    status: v.union(v.literal('planned'), v.literal('debriefed')),
    at: v.string(),
    type: meetingType,
    intent: v.string(),
    questions: v.array(meetingQuestion),
    takeaways: v.array(v.string()),
    honesty,
    notes: v.string(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_person', ['personId']),

  signals: defineTable({
    ownerId: v.string(),
    meetingId: v.id('meetings'),
    personId: v.id('people'),
    type: signalType,
    text: v.string(),
    ideaIds: v.array(v.id('ideas')),
  })
    .index('by_owner', ['ownerId'])
    .index('by_person', ['personId']),

  ideas: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.string(),
    status: ideaStatus,
    keyQuestions: v.array(v.string()),
  }).index('by_owner', ['ownerId']),

  beliefs: defineTable({
    ownerId: v.string(),
    ideaId: v.id('ideas'),
    statement: v.string(),
  }).index('by_owner', ['ownerId']),

  nextSteps: defineTable({
    ownerId: v.string(),
    meetingId: v.id('meetings'),
    personId: v.id('people'),
    owner: v.union(v.literal('me'), v.literal('them')),
    type: nextStepType,
    description: v.string(),
    dueAt: v.optional(v.string()),
    done: v.boolean(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_person', ['personId']),
})
