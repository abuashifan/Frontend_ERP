export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_BASE_URL
  return url && url.length > 0 ? url : 'http://localhost:8000'
}
