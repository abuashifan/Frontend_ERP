import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '../../stores/auth'
import { useTenantStore } from '../../stores/tenant'
import { emitAuthUnauthorized } from '../events'
import { getApiBaseUrl } from './baseUrl'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: 'application/json',
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
    if (error?.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.clear()
      emitAuthUnauthorized()
    }

    return Promise.reject(error)
  },
)
