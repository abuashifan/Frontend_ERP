function parseBooleanEnv(value: unknown, defaultValue: boolean): boolean {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return defaultValue
}

export const TENANT_SWITCHER_ENABLED = parseBooleanEnv(
  import.meta.env.VITE_TENANT_SWITCHER_ENABLED,
  false,
)

export const DEFAULT_COMPANY_ID = (() => {
  const raw = import.meta.env.VITE_COMPANY_ID
  if (typeof raw !== 'string') return null
  const normalized = raw.trim()
  return normalized.length > 0 ? normalized : null
})()
