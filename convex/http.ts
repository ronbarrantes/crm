import { httpRouter } from 'convex/server'
import { api } from './_generated/api'
import { httpAction } from './_generated/server'

const http = httpRouter()

/** Escape a vCard 3.0 text value: backslashes, commas, semicolons and newlines. */
function vcardEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n|\r\n?/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/** Fold lines longer than 75 octets, as the vCard spec asks (continuations start with a space). */
function fold(line: string) {
  const chars = Array.from(line)
  const out: string[] = []
  for (let i = 0; i < chars.length; i += 74) out.push((i ? ' ' : '') + chars.slice(i, i + 74).join(''))
  return out.join('\r\n')
}

function base64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

/** GET /vcard/{slug}: the card as a .vcf file that phones open in their "add contact" screen. */
http.route({
  pathPrefix: '/vcard/',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const slug = decodeURIComponent(new URL(request.url).pathname.slice('/vcard/'.length)).replace(/\.vcf$/, '')
    const card = await ctx.runQuery(api.card.getBySlug, { slug })
    if (!card) return new Response('Not found', { status: 404 })

    const parts = card.name.trim().split(/\s+/)
    const last = parts.length > 1 ? parts.pop()! : ''
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${vcardEscape(card.name)}`,
      `N:${vcardEscape(last)};${vcardEscape(parts.join(' '))};;;`,
    ]
    if (card.company) lines.push(`ORG:${vcardEscape(card.company)}`)
    if (card.title) lines.push(`TITLE:${vcardEscape(card.title)}`)
    if (card.phone) lines.push(`TEL;TYPE=CELL:${vcardEscape(card.phone)}`)
    if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${vcardEscape(card.email)}`)
    if (card.website) lines.push(`URL:${vcardEscape(card.website)}`)
    for (const l of card.links) lines.push(`URL;TYPE=${vcardEscape(l.label.replace(/[^\w-]/g, '') || 'other')}:${vcardEscape(l.url)}`)
    if (card.bio) lines.push(`NOTE:${vcardEscape(card.bio)}`)

    if (card.photoUrl) {
      try {
        const res = await fetch(card.photoUrl)
        const type = res.headers.get('content-type') ?? ''
        if (res.ok && /jpe?g|png/i.test(type)) {
          const bytes = new Uint8Array(await res.arrayBuffer())
          lines.push(`PHOTO;ENCODING=b;TYPE=${/png/i.test(type) ? 'PNG' : 'JPEG'}:${base64(bytes)}`)
        }
      } catch {
        // The contact still saves without a photo.
      }
    }
    lines.push('END:VCARD')

    const filename = `${card.slug.replace(/[^a-z0-9-]/g, '') || 'contact'}.vcf`
    return new Response(lines.map(fold).join('\r\n') + '\r\n', {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=60',
      },
    })
  }),
})

export default http
