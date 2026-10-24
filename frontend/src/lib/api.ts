import { getCurrentSession, refreshSession, type AuthSession } from './supabase'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

if (!import.meta.env.DEV && !configuredApiUrl) {
  throw new Error('Missing VITE_API_URL. Configure the deployed Render API URL in Vercel.')
}

const apiBaseUrl = (configuredApiUrl || 'http://localhost:5000').replace(/\/+$/, '')

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}

async function fetchWithSession(path: string, session: AuthSession, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60_000)
  try {
    return await fetch(apiUrl(path), {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`,
      },
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function authenticatedApiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = await getCurrentSession()
  if (!session) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetchWithSession(path, session, options)
  if (response.status !== 401) return response

  const refreshed = await refreshSession(session)
  if (!refreshed) throw new Error('Your session has expired. Please sign in again.')
  return fetchWithSession(path, refreshed, options)
}
