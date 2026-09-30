// Mirrors the Phase 1 data model in PLAN.md §9. Convex replaces the in-memory store later.

export type Id = string

export type RelationshipStage = 'stranger' | 'acquaintance' | 'contact' | 'friend'
export type Flag = 'pitching-me' | 'not-a-fit' | 'great-connector'
export type NextStepType = 'none' | 'time' | 'introduction' | 'money'
export type IdeaStatus = 'exploring' | 'building-evidence' | 'committed' | 'parked'
export type MeetingType = 'event' | 'coffee' | 'call' | 'demo'
export type QuestionProgress = 'answered' | 'partly' | 'not-asked'
export type SignalType =
  | 'problem'
  | 'goal'
  | 'obstacle'
  | 'workaround'
  | 'money'
  | 'context'
  | 'emotion'
  | 'request'
  | 'mention'
  | 'noise'

export interface EventInfo {
  id: Id
  name: string
  place: string
  date: string // ISO
  endsAt: string // ISO, midnight local
}

export interface Person {
  id: Id
  name: string
  hookLine: string
  photoUrl?: string
  role?: string
  company?: string
  email?: string
  phone?: string
  personalNotes?: string
  stage: RelationshipStage
  flags: Flag[]
  ideaIds: Id[]
  eventId?: Id
  metAt: string // ISO
  introducedBy?: string
  needsTriage: boolean
  followUpAt?: string // ISO
  source: 'capture' | 'manual'
}

export interface MeetingQuestion {
  text: string
  progress: QuestionProgress
  note: string
}

export interface HonestyCheck {
  gotFacts: boolean | null
  pitchedTooEarly: boolean | null
  theyPitchedMe: boolean | null
}

export interface Meeting {
  id: Id
  personId: Id
  status: 'planned' | 'debriefed'
  at: string // ISO
  type: MeetingType
  intent: string
  questions: MeetingQuestion[]
  takeaways: string[]
  honesty: HonestyCheck
  notes: string
}

export interface Signal {
  id: Id
  meetingId: Id
  personId: Id
  type: SignalType
  text: string
  ideaIds: Id[]
}

export interface Idea {
  id: Id
  name: string
  description: string
  status: IdeaStatus
  keyQuestions: string[]
}

export interface Belief {
  id: Id
  ideaId: Id
  statement: string
}

export interface NextStep {
  id: Id
  meetingId: Id
  personId: Id
  owner: 'me' | 'them'
  type: NextStepType
  description: string
  dueAt?: string // ISO
  done: boolean
}

export interface Data {
  activeEvent: EventInfo | null
  events: EventInfo[]
  people: Person[]
  meetings: Meeting[]
  signals: Signal[]
  ideas: Idea[]
  beliefs: Belief[]
  nextSteps: NextStep[]
}
