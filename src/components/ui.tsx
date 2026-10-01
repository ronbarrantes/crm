import { createLink } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { initials } from '~/lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[0.95rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const buttonVariants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-rule-strong bg-card text-ink hover:bg-soft hover:text-on-soft',
  ghost: 'text-ink-2 hover:bg-soft hover:text-on-soft',
  danger: 'border border-rule-strong bg-card text-danger hover:bg-danger-soft',
}

export function Button({ variant = 'secondary', className, ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button type="button" className={clsx(buttonBase, buttonVariants[variant], className)} {...props} />
}

function ButtonAnchor({ variant = 'secondary', className, ...props }: ComponentProps<'a'> & { variant?: Variant }) {
  return <a className={clsx(buttonBase, buttonVariants[variant], className)} {...props} />
}

export const ButtonLink = createLink(ButtonAnchor)

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section className={clsx('min-w-0 rounded-2xl border border-rule bg-card', className)} {...props} />
}

export function CardHeader({ title, action, id }: { title: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
      <h2 id={id} className="text-[0.95rem]">
        {title}
      </h2>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:mb-6">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger'
const tones: Record<Tone, string> = {
  neutral: 'border-rule-strong text-ink-2',
  accent: 'border-transparent bg-soft text-on-soft',
  ok: 'border-transparent bg-ok-soft text-ok',
  warn: 'border-transparent bg-warn-soft text-warn',
  danger: 'border-transparent bg-danger-soft text-danger',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Avatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' }[size]
  if (photoUrl) return <img src={photoUrl} alt="" className={clsx('shrink-0 rounded-full object-cover', dims)} />
  return (
    <span aria-hidden className={clsx('grid shrink-0 place-items-center rounded-full bg-soft font-semibold text-on-soft', dims)}>
      {initials(name)}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-ink-2">{children}</p>
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-2">{hint}</p>}
    </div>
  )
}

/** A set of toggle chips. Uses real checkboxes/radios so it works with keyboard and screen readers. */
export function ChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  multiple,
  hideLegend,
  hints,
}: {
  legend: string
  options: { value: T; label: string }[]
  value: T | T[]
  onChange: (value: T) => void
  multiple?: boolean
  hideLegend?: boolean
  hints?: Partial<Record<T, string>>
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  const name = legend.replace(/\W+/g, '-').toLowerCase()
  return (
    <fieldset className="min-w-0">
      <legend className={clsx(hideLegend ? 'sr-only' : 'mb-2 text-sm font-medium')}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            title={hints?.[o.value]}
            className={clsx(
              'relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]',
              selected(o.value) ? 'border-accent bg-soft text-on-soft' : 'border-rule-strong bg-card text-ink hover:bg-soft',
            )}
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              className="sr-only"
              checked={selected(o.value)}
              onChange={() => onChange(o.value)}
            />
            {selected(o.value) && multiple && <span aria-hidden className="mr-1">✓</span>}
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

