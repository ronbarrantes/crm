// Client data layer: one live Convex query for everything the user owns, plus thin wrappers
// around the Convex mutations so screens can call plain async functions.
import { useQuery } from 'convex/react'
import type { FunctionArgs } from 'convex/server'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id as ConvexId, TableNames } from '../../convex/_generated/dataModel'
import { convex } from './convex'
import { compressImage } from './image'
import { progressRank } from './vocab'
import type { Data, EventInfo, Id, Idea, Meeting, MeetingQuestion, NextStep, NextStepType, Person, Signal } from './types'

const EMPTY: Data = { activeEvent: null, events: [], people: [], meetings: [], signals: [], ideas: [], beliefs: [], nextSteps: [] }

/** Latest event whose end time hasn't passed yet. */
function currentEvent(events: EventInfo[], now: number): EventInfo | null {
  return [...events].filter((e) => new Date(e.endsAt).getTime() > now).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

/**
 * The current time, refreshed when the next event ends and whenever the app comes back to the
 * foreground (phones pause timers in the background), so event mode switches off on time.
 */
function useEventClock(events: EventInfo[] | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const nextEnd = (events ?? []).map((e) => new Date(e.endsAt).getTime()).filter((t) => t > Date.now()).sort((a, b) => a - b)[0]
    // setTimeout caps out around 24.8 days; events end the same night, so this is plenty.
    const timer = nextEnd ? setTimeout(tick, Math.min(nextEnd - Date.now() + 500, 2 ** 31 - 1)) : undefined
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', tick)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', tick)
    }
  }, [events])
  return now
}

/** Live data, or undefined while the first load is in flight. */
export function useDataOrLoading(): Data | undefined {
  const result = useQuery(api.data.all)
  // The clock only triggers re-renders at expiry/resume; always compare against the real current time,
  // so an event ended a moment ago (its endsAt is "now") switches off immediately.
  const tick = useEventClock(result?.events)
  if (!result) return undefined
  return { ...(result as Omit<Data, 'activeEvent'>), activeEvent: currentEvent(result.events, Math.max(tick, Date.now())) }
}

/** Live data. Screens render inside AppShell, which waits for the first load. */
export function useData(): Data {
  return useDataOrLoading() ?? EMPTY
}

// ---------- selectors ----------

export function activeEvent(d: Data): EventInfo | null {
  return d.activeEvent
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

// Screen code uses plain string ids; Convex checks them against the right table on the server.
const as = <T extends TableNames>(id: Id) => id as ConvexId<T>

function midnightTonight() {
  const d = new Date()
  d.setHours(24, 0, 0, 0)
  return d.toISOString()
}

export async function startEvent(name: string, place: string) {
  return convex.mutation(api.events.start, { name, place, endsAt: midnightTonight() })
}

export async function endEvent(id: Id) {
  return convex.mutation(api.events.end, { id: as<'events'>(id) })
}

export async function uploadPhoto(file: File): Promise<ConvexId<'_storage'>> {
  const blob = await compressImage(file)
  const url = await convex.mutation(api.people.generatePhotoUploadUrl, {})
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob })
  if (!res.ok) throw new Error('Photo upload failed')
  const { storageId } = (await res.json()) as { storageId: ConvexId<'_storage'> }
  return storageId
}

export async function capture(input: { name: string; hookLine: string; photo?: File; eventId?: Id }) {
  const photoId = input.photo ? await uploadPhoto(input.photo) : undefined
  return convex.mutation(api.people.capture, {
    name: input.name,
    hookLine: input.hookLine,
    photoId,
    eventId: input.eventId ? as<'events'>(input.eventId) : undefined,
  })
}

type PersonPatch = Partial<Pick<Person, 'name' | 'role' | 'company' | 'email' | 'phone' | 'personalNotes' | 'stage' | 'flags' | 'ideaIds' | 'needsTriage'>> & {
  /** null clears the follow-up */
  followUpAt?: string | null
}

export async function updatePerson(id: Id, patch: PersonPatch) {
  return convex.mutation(api.people.update, { id: as<'people'>(id), patch: { ...patch, ideaIds: patch.ideaIds?.map((i) => as<'ideas'>(i)) } })
}

/** Fold a fresh capture into someone already known, then delete the duplicate. */
export async function mergeInto(
  duplicateId: Id,
  targetId: Id,
  { metOn, edits, choices }: { metOn: string; edits: Omit<FunctionArgs<typeof api.people.merge>['edits'], 'ideaIds'> & { ideaIds?: Id[] }; choices: FunctionArgs<typeof api.people.merge>['choices'] },
) {
  return convex.mutation(api.people.merge, {
    duplicateId: as<'people'>(duplicateId),
    targetId: as<'people'>(targetId),
    metOn,
    edits: { ...edits, ideaIds: edits.ideaIds?.map((i) => as<'ideas'>(i)) },
    choices,
  })
}

export async function planMeeting(input: Pick<Meeting, 'personId' | 'at' | 'type' | 'intent'> & { questions: string[] }) {
  return convex.mutation(api.meetings.plan, { ...input, personId: as<'people'>(input.personId) })
}

/** Debrief of an unplanned conversation: creates the meeting on the spot. */
export async function startUnplannedMeeting(personId: Id) {
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

export async function saveDebrief(input: DebriefInput) {
  return convex.mutation(api.meetings.saveDebrief, {
    ...input,
    meetingId: as<'meetings'>(input.meetingId),
    signals: input.signals.map((s) => ({ ...s, ideaIds: s.ideaIds.map((i) => as<'ideas'>(i)) })),
  })
}

export async function toggleNextStep(id: Id) {
  return convex.mutation(api.meetings.toggleNextStep, { id: as<'nextSteps'>(id) })
}

export async function clearFollowUp(personId: Id) {
  return updatePerson(personId, { followUpAt: null })
}

export async function updateIdea(id: Id, patch: Partial<Pick<Idea, 'name' | 'description' | 'status' | 'keyQuestions'>>) {
  return convex.mutation(api.ideas.update, { id: as<'ideas'>(id), patch })
}

export async function addIdea(name: string) {
  return convex.mutation(api.ideas.add, { name })
}

export async function addBelief(ideaId: Id, statement: string) {
  return convex.mutation(api.ideas.addBelief, { ideaId: as<'ideas'>(ideaId), statement })
}

export async function removeBelief(id: Id) {
  return convex.mutation(api.ideas.removeBelief, { id: as<'beliefs'>(id) })
}

export async function loadSampleData() {
  return convex.mutation(api.sample.load, {})
}

export async function clearMyData() {
  return convex.mutation(api.sample.clearMine, {})
}
