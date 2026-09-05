const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

if (!import.meta.env.DEV && !configuredApiUrl) {
  throw new Error('Missing VITE_API_URL. Configure the deployed Render API URL in Vercel.')
}

const apiBaseUrl = (configuredApiUrl || 'http://localhost:5000').replace(/\/+$/, '')

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}
