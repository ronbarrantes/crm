// In-memory stand-in for Convex while the screens are built. Refreshing resets it.
import { useSyncExternalStore } from 'react'
import { createSampleData } from './sample-data'
import { progressRank } from './vocab'
import type { Data, EventInfo, Id, Meeting, MeetingQuestion, NextStep, NextStepType, Person, Signal } from './types'

let data: Data = createSampleData()
const listeners = new Set<() => void>()
let counter = 0

function newId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

function set(next: Data) {
  data = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useData(): Data {
  return useSyncExternalStore(subscribe, () => data, () => data)
}

// ---------- selectors ----------

export function activeEvent(d: Data): EventInfo | null {
  if (!d.activeEvent) return null
  return new Date(d.activeEvent.endsAt) > new Date() ? d.activeEvent : null
}

export function personById(d: Data, id: Id) {
  return d.people.find((p) => p.id === id)
}

export function eventById(d: Data, id: Id | undefined) {
  return id ? d.events.find((e) => e.id === id) : undefined
}

export function meetingsFor(d: Data, personId: Id) {
  return d.meetings.filter((m) => m.personId === personId).sort((a, b) => b.at.localeCompare(a.at))
}

export function lastDebriefed(d: Data, personId: Id) {
  return meetingsFor(d, personId).find((m) => m.status === 'debriefed')
}

export function openNextSteps(d: Data, personId?: Id) {
  return d.nextSteps.filter((n) => !n.done && n.type !== 'none' && (!personId || n.personId === personId))
}

/** Strongest next step type ever agreed with this person (the Progress badge). */
export function progressFor(d: Data, personId: Id): NextStepType {
  return d.nextSteps
    .filter((n) => n.personId === personId)
    .reduce<NextStepType>((best, n) => (progressRank[n.type] > progressRank[best] ? n.type : best), 'none')
}

export function inbox(d: Data) {
  return d.people.filter((p) => p.needsTriage).sort((a, b) => b.metAt.localeCompare(a.metAt))
}

// ---------- actions ----------

function midnightTonight() {
  const d = new Date()
  d.setHours(24, 0, 0, 0)
  return d.toISOString()
}

export function startEvent(name: string, place: string) {
  const ev: EventInfo = { id: newId('ev'), name, place, date: new Date().toISOString(), endsAt: midnightTonight() }
  set({ ...data, activeEvent: ev, events: [...data.events, ev] })
}

export function endEvent() {
  if (!data.activeEvent) return
  const now = new Date().toISOString()
  set({
    ...data,
    activeEvent: null,
    events: data.events.map((e) => (e.id === data.activeEvent?.id ? { ...e, endsAt: now } : e)),
  })
}

export function capture(input: { name: string; hookLine: string; photoUrl?: string }) {
  const ev = activeEvent(data)
  const person: Person = {
    id: newId('p'),
    name: input.name,
    hookLine: input.hookLine,
    photoUrl: input.photoUrl,
    stage: 'stranger',
    flags: [],
    ideaIds: [],
    eventId: ev?.id,
    metAt: new Date().toISOString(),
    needsTriage: true,
    source: 'capture',
  }
  set({ ...data, people: [person, ...data.people] })
  return person
}

export function updatePerson(id: Id, patch: Partial<Person>) {
  set({ ...data, people: data.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
}

/** Fold a fresh capture into someone already known, then delete the duplicate. */
export function mergeInto(duplicateId: Id, targetId: Id) {
  const dup = personById(data, duplicateId)
  const target = personById(data, targetId)
  if (!dup || !target) return
  const notes = [target.personalNotes, `Also noted: ${dup.hookLine}`].filter(Boolean).join('\n')
  set({
    ...data,
    people: data.people
      .filter((p) => p.id !== duplicateId)
      .map((p) =>
        p.id === targetId ? { ...p, personalNotes: notes, photoUrl: p.photoUrl ?? dup.photoUrl } : p,
      ),
  })
}

export function planMeeting(input: Pick<Meeting, 'personId' | 'at' | 'type' | 'intent'> & { questions: string[] }) {
  const meeting: Meeting = {
    id: newId('m'),
    personId: input.personId,
    status: 'planned',
    at: input.at,
    type: input.type,
    intent: input.intent,
    questions: input.questions.filter((q) => q.trim()).map((text) => ({ text, progress: 'not-asked', note: '' })),
    takeaways: [],
    honesty: { gotFacts: null, pitchedTooEarly: null, theyPitchedMe: null },
    notes: '',
  }
  set({ ...data, meetings: [...data.meetings, meeting] })
  return meeting
}

/** Debrief of an unplanned conversation: creates the meeting on the spot. */
export function startUnplannedMeeting(personId: Id) {
  return planMeeting({ personId, at: new Date().toISOString(), type: 'coffee', intent: '', questions: [] })
}

export interface DebriefInput {
  meetingId: Id
  questions: MeetingQuestion[]
  takeaways: string[]
  signals: Omit<Signal, 'id' | 'meetingId' | 'personId'>[]
  honesty: Meeting['honesty']
  nextStep: Omit<NextStep, 'id' | 'meetingId' | 'personId' | 'done'>
  notes: string
}

export function saveDebrief(input: DebriefInput) {
  const meeting = data.meetings.find((m) => m.id === input.meetingId)
  if (!meeting) return
  const personId = meeting.personId
  const person = personById(data, personId)
  const flags =
    input.honesty.theyPitchedMe && person && !person.flags.includes('pitching-me')
      ? [...person.flags, 'pitching-me' as const]
      : person?.flags
  set({
    ...data,
    meetings: data.meetings.map((m) =>
      m.id === meeting.id
        ? { ...m, status: 'debriefed', questions: input.questions, takeaways: input.takeaways, honesty: input.honesty, notes: input.notes }
        : m,
    ),
    signals: [
      ...data.signals,
      ...input.signals.map((s) => ({ ...s, id: newId('s'), meetingId: meeting.id, personId })),
    ],
    nextSteps: [...data.nextSteps, { ...input.nextStep, id: newId('n'), meetingId: meeting.id, personId, done: input.nextStep.type === 'none' }],
    people: data.people.map((p) => (p.id === personId && flags ? { ...p, flags } : p)),
  })
}

export function toggleNextStep(id: Id) {
  set({ ...data, nextSteps: data.nextSteps.map((n) => (n.id === id ? { ...n, done: !n.done } : n)) })
}

export function clearFollowUp(personId: Id) {
  updatePerson(personId, { followUpAt: undefined })
}

export function updateIdea(id: Id, patch: Partial<Data['ideas'][number]>) {
  set({ ...data, ideas: data.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
}

export function addIdea(name: string) {
  const idea = { id: newId('i'), name, description: '', status: 'exploring' as const, keyQuestions: [] }
  set({ ...data, ideas: [...data.ideas, idea] })
  return idea
}

export function addBelief(ideaId: Id, statement: string) {
  set({ ...data, beliefs: [...data.beliefs, { id: newId('b'), ideaId, statement }] })
}

export function removeBelief(id: Id) {
  set({ ...data, beliefs: data.beliefs.filter((b) => b.id !== id) })
}
