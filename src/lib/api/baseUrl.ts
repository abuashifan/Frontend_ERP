export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  const url = raw && raw.length > 0 ? raw : 'http://localhost:8000'

  // In Laravel, routes in routes/api.php are served under the /api prefix.
  // Allow configuring either:
  // - http://127.0.0.1:8000  -> normalized to http://127.0.0.1:8000/api
  // - http://127.0.0.1:8000/api (kept as-is)
  const trimmed = url.replace(/\/+$/, '')
  if (trimmed.endsWith('/api')) return trimmed
  return `${trimmed}/api`
}
