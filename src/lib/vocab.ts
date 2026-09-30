import type {
  Flag,
  IdeaStatus,
  MeetingType,
  NextStepType,
  QuestionProgress,
  RelationshipStage,
  SignalType,
} from './types'

export const stageLabel: Record<RelationshipStage, string> = {
  stranger: 'Stranger',
  acquaintance: 'Acquaintance',
  contact: 'Contact',
  friend: 'Friend',
}
export const stages = Object.keys(stageLabel) as RelationshipStage[]

export const flagLabel: Record<Flag, string> = {
  'pitching-me': 'Pitching me',
  'not-a-fit': 'Not a fit',
  'great-connector': 'Great connector',
}
export const flags = Object.keys(flagLabel) as Flag[]

export const nextStepLabel: Record<NextStepType, string> = {
  none: 'None',
  time: 'Time',
  introduction: 'Introduction',
  money: 'Money',
}
export const nextStepHint: Record<NextStepType, string> = {
  none: 'No commitment yet',
  time: 'Another meeting, a trial',
  introduction: 'Connects you to someone',
  money: 'A deposit, a purchase',
}
export const nextStepTypes = Object.keys(nextStepLabel) as NextStepType[]
export const progressRank: Record<NextStepType, number> = { none: 0, time: 1, introduction: 2, money: 3 }

export const ideaStatusLabel: Record<IdeaStatus, string> = {
  exploring: 'Exploring',
  'building-evidence': 'Building evidence',
  committed: 'Committed',
  parked: 'Parked',
}
export const ideaStatuses = Object.keys(ideaStatusLabel) as IdeaStatus[]

export const meetingTypeLabel: Record<MeetingType, string> = {
  event: 'Event',
  coffee: 'Coffee',
  call: 'Call',
  demo: 'Demo',
}
export const meetingTypes = Object.keys(meetingTypeLabel) as MeetingType[]

export const progressLabel: Record<QuestionProgress, string> = {
  answered: 'Answered',
  partly: 'Partly',
  'not-asked': 'Not asked',
}

export const signalLabel: Record<SignalType, string> = {
  problem: 'Problem',
  goal: 'Goal',
  obstacle: 'Obstacle',
  workaround: 'Workaround',
  money: 'Money',
  context: 'Context',
  emotion: 'Emotion',
  request: 'Request',
  mention: 'Mention',
  noise: 'Noise',
}
export const signalHint: Record<SignalType, string> = {
  problem: 'Something they struggle with',
  goal: 'What they want to achieve',
  obstacle: 'What’s in the way',
  workaround: 'How they cope today',
  money: 'What they pay, budgets, who decides',
  context: 'How their work operates',
  emotion: 'Strong feelings',
  request: 'Something they asked for',
  mention: 'A person or company they named',
  noise: 'Compliments, hypotheticals, “I usually…”',
}
export const signalTypes = Object.keys(signalLabel) as SignalType[]
