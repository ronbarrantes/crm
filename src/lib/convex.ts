import { ConvexReactClient } from 'convex/react'

const url = import.meta.env.VITE_CONVEX_URL as string | undefined
if (!url) throw new Error('VITE_CONVEX_URL is not set. Run `vercel env pull` to get the dev keys.')

export const convex = new ConvexReactClient(url)

/** Where Convex HTTP actions (like the vCard download) are served: the .site twin of the .cloud URL. */
export const convexSiteUrl = ((import.meta.env.VITE_CONVEX_SITE_URL as string | undefined) ?? url.replace(/\.cloud(\/?)$/, '.site$1')).replace(/\/$/, '')
