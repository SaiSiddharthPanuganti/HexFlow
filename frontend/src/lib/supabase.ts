const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '')
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const SESSION_KEY = 'hexflow-supabase-session'

export const supabaseConfigured = Boolean(projectUrl && publishableKey)

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: { id: string; email?: string }
}

function requireConfig(): { url: string; key: string } {
  if (!projectUrl || !publishableKey) throw new Error('Supabase is not configured. Add the public URL and publishable key to your environment.')
  return { url: projectUrl, key: publishableKey }
}

function saveSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) as AuthSession : null
  } catch { return null }
}

async function request<T>(path: string, options: RequestInit = {}, session?: AuthSession, retry = true): Promise<T> {
  const { url, key } = requireConfig()
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => null) as { message?: string; msg?: string; error_description?: string; error?: string } | null
  if (response.status === 401 && session && retry) {
    const refreshed = await refreshSession(session)
    if (refreshed) return request(path, options, refreshed, false)
  }
  if (!response.ok) throw new Error(payload?.message || payload?.msg || payload?.error_description || payload?.error || `Supabase request failed (${response.status})`)
  return payload as T
}

export async function refreshSession(current: AuthSession): Promise<AuthSession | null> {
  try {
    const refreshed = await request<Omit<AuthSession, 'user'> & { user: AuthSession['user']; expires_in?: number }>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: JSON.stringify({ refresh_token: current.refresh_token }),
    })
    const next = { ...refreshed, expires_at: refreshed.expires_at ?? Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600) }
    saveSession(next)
    return next
  } catch {
    saveSession(null)
    return null
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const current = readSession()
  if (!current) {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (params.get('type') === 'recovery' && accessToken && refreshToken) {
      const recoverySession = { access_token: accessToken, refresh_token: refreshToken, user: { id: '' } }
      const user = await request<AuthSession['user']>('/auth/v1/user', {}, recoverySession, false)
      const session = {
        ...recoverySession,
        user,
        expires_at: Math.floor(Date.now() / 1000) + Number(params.get('expires_in') ?? 3600),
      }
      saveSession(session)
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
      return session
    }
    return null
  }
  if (current.expires_at && current.expires_at * 1000 > Date.now() + 60_000) return current
  return refreshSession(current)
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const data = await request<AuthSession & { expires_in?: number }>('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  const session = { ...data, expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600) }
  saveSession(session)
  return session
}

export async function signUp(email: string, password: string): Promise<AuthSession | null> {
  const data = await request<Partial<AuthSession> & { access_token?: string; refresh_token?: string; expires_in?: number }>('/auth/v1/signup', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  if (!data.access_token || !data.refresh_token || !data.user) return null
  const session = { ...data, access_token: data.access_token, refresh_token: data.refresh_token, user: data.user, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600) } as AuthSession
  saveSession(session)
  return session
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request('/auth/v1/recover', {
    method: 'POST',
    body: JSON.stringify({ email, redirect_to: window.location.origin }),
  })
}

export async function updatePassword(session: AuthSession, password: string): Promise<void> {
  await request('/auth/v1/user', {
    method: 'PUT',
    body: JSON.stringify({ password }),
  }, session)
}

export async function signOut(): Promise<void> {
  const current = readSession()
  try { if (current) await request('/auth/v1/logout', { method: 'POST' }, current) }
  finally { saveSession(null) }
}

export async function cloudSaveWorkflow(session: AuthSession, workflow: unknown, brief: string, expectedRevision: number | null): Promise<number> {
  const item = workflow as { id: string; title: string }
  if (expectedRevision === null) {
    const rows = await request<Array<{ revision: number }>>('/rest/v1/workflows?select=revision', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([{ id: item.id, title: item.title, brief, data: workflow }]),
    }, session)
    return rows[0]?.revision ?? 1
  }

  const rows = await request<Array<{ revision: number }>>(`/rest/v1/workflows?id=eq.${encodeURIComponent(item.id)}&revision=eq.${expectedRevision}&select=revision`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ title: item.title, brief, data: workflow }),
  }, session)
  if (rows.length === 0) throw new Error('This workflow changed elsewhere. Reload it before saving again.')
  return rows[0].revision
}

export async function cloudLoadLatest(session: AuthSession): Promise<{ workflow: import('../types/workflow.types').Workflow; brief: string; updatedAt: string; revision: number } | null> {
  const rows = await request<Array<{ data: import('../types/workflow.types').Workflow; brief: string | null; updated_at: string; revision: number }>>(
    '/rest/v1/workflows?select=data,brief,updated_at,revision&order=updated_at.desc&limit=1', {}, session,
  )
  const row = rows[0]
  return row ? { workflow: row.data, brief: row.brief ?? '', updatedAt: row.updated_at, revision: row.revision } : null
}
