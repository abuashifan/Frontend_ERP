import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '../../stores/auth'
import { useTenantStore } from '../../stores/tenant'
import { emitAuthUnauthorized } from '../events'
import { getApiBaseUrl } from './baseUrl'

function serializeQueryParams(params: unknown): string {
  const search = new URLSearchParams()

  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      for (const v of value) append(key, v)
      return
    }

    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        append(`${key}[${k}]`, v)
      }
      return
    }

    if (typeof value === 'boolean') {
      search.append(key, value ? '1' : '0')
      return
    }

    search.append(key, String(value))
  }

  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
      append(k, v)
    }
  }

  return search.toString()
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: 'application/json',
  },
  // Prevent querystring booleans from becoming "true"/"false" strings.
  // Laravel's boolean validator is strict; it reliably accepts 1/0.
  paramsSerializer: {
    serialize: serializeQueryParams,
  },
})

function setHeader(config: InternalAxiosRequestConfig, key: string, value: string) {
  config.headers = config.headers ?? {}
  const headers = config.headers as AxiosRequestHeaders
  headers[key] = value
}

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    setHeader(config, 'Authorization', `Bearer ${authStore.token}`)
  }

  const tenantStore = useTenantStore()
  if (tenantStore.activeCompanyId) {
    setHeader(config, 'X-Company-Id', tenantStore.activeCompanyId)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize backend API error shapes into a useful Error.message.
    // Backend uses `NormalizeApiErrors` so most failures are: { error: { message, details? } }
    const data = error?.response?.data as
      | {
          message?: unknown
          error?: { message?: unknown; details?: Record<string, unknown> }
        }
      | undefined

    const apiMessage = data?.error?.message ?? data?.message
    if (apiMessage !== undefined && apiMessage !== null) {
      error.message = String(apiMessage)
    } else {
      // Try to surface a first validation error if present.
      const details = data?.error?.details
      if (details && typeof details === 'object') {
        const firstKey = Object.keys(details)[0]
        if (!firstKey) {
          return Promise.reject(error)
        }

        const firstVal = (details as any)[firstKey]
        if (typeof firstVal === 'string') {
          error.message = firstVal
        } else if (Array.isArray(firstVal) && firstVal.length > 0) {
          error.message = String(firstVal[0])
        }
      }
    }

    if (error?.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.clear()
      emitAuthUnauthorized()
    }

    return Promise.reject(error)
  },
)
