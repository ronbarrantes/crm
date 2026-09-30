const dayMs = 86_400_000

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export function dayDiff(iso: string, now = new Date()) {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / dayMs)
}

export function relativeDay(iso: string) {
  const diff = dayDiff(iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return new Date(iso).toLocaleDateString(undefined, { weekday: 'long' })
  if (diff < 0 && diff > -7) return `${-diff} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function time(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function dayAndTime(iso: string) {
  return `${relativeDay(iso)}, ${time(iso)}`
}

export function longDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(iso: string) {
  return dayDiff(iso) < 0
}

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toLocalDateInput(iso: string) {
  return toLocalInput(iso).slice(0, 10)
}

export function fromLocalInput(value: string) {
  return new Date(value).toISOString()
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}
