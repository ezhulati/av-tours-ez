import type { APIRoute } from 'astro'
import { adminLogin } from '@/lib/security/admin-auth'

export const prerender = false

export const POST: APIRoute = async (context) => {
  return adminLogin(context)
}