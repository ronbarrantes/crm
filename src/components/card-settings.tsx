import { useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { ConvexError } from 'convex/values'
import { Download, ExternalLink, Plus, X } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import { Button, Card, Field } from './ui'
import { activeEvent, saveCard, useData } from '~/lib/store'

type Link = { label: string; url: string }
type Form = { slug: string; name: string; title: string; company: string; phone: string; email: string; website: string; bio: string; links: Link[] }

const blank: Form = { slug: '', name: '', title: '', company: '', phone: '', email: '', website: '', bio: '', links: [] }

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

function useOrigin() {
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  return origin
}

/** Settings: edit the public business card, and make QR codes for it. */
export function CardSettings() {
  const card = useQuery(api.card.mine)
  const origin = useOrigin()
  if (card === undefined) return null
  const url = card && origin ? `${origin}/c/${card.slug}` : ''
  return (
    <>
      <CardEditor initial={card ? toForm(card) : blank} photoUrl={card?.photoUrl} url={url} />
      {card && url && <QrCard url={url} name={card.name} />}
    </>
  )
}

function toForm(card: NonNullable<FunctionReturnType<typeof api.card.mine>>): Form {
  return {
    slug: card.slug,
    name: card.name,
    title: card.title ?? '',
    company: card.company ?? '',
    phone: card.phone ?? '',
    email: card.email ?? '',
    website: card.website ?? '',
    bio: card.bio ?? '',
    links: card.links,
  }
}

function CardEditor({ initial, photoUrl, url }: { initial: Form; photoUrl?: string; url: string }) {
  const [form, setForm] = useState(initial)
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const set = (key: Exclude<keyof Form, 'links'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const setLink = (i: number, patch: Partial<Link>) => setForm((f) => ({ ...f, links: f.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))
  const shownPhoto = photo === null ? undefined : (photo?.preview ?? photoUrl)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await saveCard({ ...form, slug: form.slug || slugify(form.name), photo: photo === null ? null : photo?.file })
      setPhoto(undefined)
      setMessage('Card saved.')
    } catch (err) {
      setError(err instanceof ConvexError ? String(err.data) : 'Couldn’t save the card. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[0.95rem]">Business card</h2>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent">
            Open card <ExternalLink aria-hidden className="size-4" />
          </a>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-2">
        A public page anyone can open from your QR code. They can save your contact and send you theirs, which lands in your Inbox.
      </p>
      <form onSubmit={save} className="mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {shownPhoto ? <img src={shownPhoto} alt="" className="size-16 object-cover" /> : <span className="size-16 bg-soft" aria-hidden />}
          <label className="inline-flex min-h-11 cursor-pointer items-center border border-rule-strong bg-card px-4 text-sm font-medium hover:bg-soft">
            {shownPhoto ? 'Change photo' : 'Add photo'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setPhoto({ file, preview: URL.createObjectURL(file) })
              }}
            />
          </label>
          {shownPhoto && (
            <Button variant="ghost" onClick={() => setPhoto(null)}>
              Remove
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="c-name">
            <input id="c-name" className="field" required maxLength={100} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Link name" htmlFor="c-slug" hint={`Your card lives at /c/${form.slug || slugify(form.name) || '…'}`}>
            <input id="c-slug" className="field" maxLength={40} placeholder={slugify(form.name)} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
          </Field>
          <Field label="Title" htmlFor="c-title">
            <input id="c-title" className="field" maxLength={100} value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Company" htmlFor="c-company">
            <input id="c-company" className="field" maxLength={100} value={form.company} onChange={set('company')} />
          </Field>
          <Field label="Phone" htmlFor="c-phone">
            <input id="c-phone" type="tel" className="field" maxLength={40} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Email" htmlFor="c-email">
            <input id="c-email" type="email" className="field" maxLength={200} value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Website" htmlFor="c-website">
            <input id="c-website" type="url" inputMode="url" className="field" maxLength={300} placeholder="ronb.co" value={form.website} onChange={set('website')} />
          </Field>
        </div>
        <Field label="Short bio (optional)" htmlFor="c-bio">
          <textarea id="c-bio" className="field min-h-20" maxLength={500} value={form.bio} onChange={set('bio')} />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Links</legend>
          {form.links.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input aria-label={`Link ${i + 1} label`} className="field" placeholder="LinkedIn" maxLength={60} value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} />
              <input aria-label={`Link ${i + 1} URL`} className="field" inputMode="url" placeholder="linkedin.com/in/…" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} />
              <Button variant="ghost" aria-label={`Remove link ${i + 1}`} onClick={() => setForm((f) => ({ ...f, links: f.links.filter((_, j) => j !== i) }))}>
                <X aria-hidden className="size-4" />
              </Button>
            </div>
          ))}
          {form.links.length < 10 && (
            <Button className="self-start" onClick={() => setForm((f) => ({ ...f, links: [...f.links, { label: '', url: '' }] }))}>
              <Plus aria-hidden className="size-4" /> Add link
            </Button>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save card'}
          </Button>
          <p role="status" className="text-sm text-ink-2">
            {message}
          </p>
        </div>
      </form>
    </Card>
  )
}

function QrCard({ url, name }: { url: string; name: string }) {
  const data = useData()
  const event = activeEvent(data)
  const [tag, setTag] = useState(() => (event ? slugify(`${event.name} ${new Date().toLocaleDateString('en-US', { month: 'short' })}`) : ''))
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const target = tag ? `${url}?event=${encodeURIComponent(tag)}` : url

  useEffect(() => {
    let live = true
    QRCode.toDataURL(target, { margin: 2, width: 480, errorCorrectionLevel: 'M' })
      .then((d) => live && setPreview(d))
      .catch(() => live && setError('Couldn’t make the QR code.'))
    return () => {
      live = false
    }
  }, [target])

  async function download() {
    setError('')
    try {
      const blob = await lockScreenPng(target, name, tag)
      const file = new File([blob], `card-qr${tag ? `-${tag}` : ''}.png`, { type: 'image/png' })
      // On phones the share sheet has "Save Image", which puts it straight in Photos.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        return
      }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Couldn’t make the image.')
    }
  }

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-[0.95rem]">QR code</h2>
      <p className="mt-1 text-sm text-ink-2">Save it as your lock screen so anyone can scan it. Add an event tag to see who you met where.</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        {preview ? <img src={preview} alt={`QR code for ${target}`} className="size-48 shrink-0 border border-rule bg-white" /> : <span className="size-48 bg-soft" />}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Field label="Event tag (optional)" htmlFor="qr-event" hint="e.g. charlotte-meetup-oct. Shows on contacts who scan this code.">
            <input id="qr-event" className="field" maxLength={80} value={tag} onChange={(e) => setTag(slugify(e.target.value))} />
          </Field>
          <p className="text-xs break-all text-ink-2">{target}</p>
          <Button variant="primary" className="self-start" onClick={download}>
            <Download aria-hidden className="size-4" /> Lock screen image
          </Button>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

/** A phone-sized PNG (iPhone Pro proportions): dark background, the code below the clock, a label under it. */
async function lockScreenPng(url: string, name: string, tag: string) {
  const W = 1179
  const H = 2556
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0e0d13'
  ctx.fillRect(0, 0, W, H)

  const qr = document.createElement('canvas')
  await QRCode.toCanvas(qr, url, { margin: 2, width: 760, errorCorrectionLevel: 'M', color: { dark: '#111015', light: '#ffffff' } })
  const x = (W - qr.width) / 2
  const y = 980
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - 30, y - 30, qr.width + 60, qr.height + 60)
  ctx.drawImage(qr, x, y)

  await document.fonts?.ready
  ctx.fillStyle = '#f2eff8'
  ctx.textAlign = 'center'
  ctx.font = "600 72px 'Mona Sans', ui-sans-serif, system-ui, sans-serif"
  ctx.fillText(name, W / 2, y + qr.height + 160, W - 120)
  ctx.fillStyle = '#aaa4b9'
  ctx.font = "400 44px 'Mona Sans', ui-sans-serif, system-ui, sans-serif"
  ctx.fillText(tag ? 'Scan to connect · ' + tag : 'Scan to save my contact', W / 2, y + qr.height + 240, W - 120)

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'))
}
