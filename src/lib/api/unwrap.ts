export type ApiEnvelope<T> = {
  data: T
}

export type Paginator<T> = {
  data: T[]
} & Record<string, unknown>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function unwrapData<T>(payload: unknown): T {
  if (isObject(payload) && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data
  }
  return payload as T
}

export function unwrapList<T>(payload: unknown): T[] {
  const unwrapped = unwrapData<unknown>(payload)

  if (Array.isArray(unwrapped)) return unwrapped as T[]

  if (isObject(unwrapped) && Array.isArray((unwrapped as Paginator<T>).data)) {
    return (unwrapped as Paginator<T>).data
  }

  return []
}
