function parseBooleanEnv(value: unknown, defaultValue: boolean): boolean {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return defaultValue
}

// Default enabled; can be disabled explicitly for local UI work.
export const AUTH_ENABLED = parseBooleanEnv(import.meta.env.VITE_AUTH_ENABLED, true)
