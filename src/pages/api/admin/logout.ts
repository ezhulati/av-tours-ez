import type { APIRoute } from 'astro'
import { adminLogout } from '@/lib/security/admin-auth'

export const prerender = false

export const POST: APIRoute = async (context) => {
  return adminLogout(context)
}