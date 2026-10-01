import type { AuthConfig } from 'convex/server'

const domain = process.env.CLERK_FRONTEND_API_URL
if (!domain) throw new Error('CLERK_FRONTEND_API_URL must be set on this Convex deployment')

export default {
  providers: [{ domain, applicationID: 'convex' }],
} satisfies AuthConfig
