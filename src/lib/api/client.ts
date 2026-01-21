import axios from 'axios'

import { useAuthStore } from '../../stores/auth'
import { emitAuthUnauthorized } from '../events'
import { getApiBaseUrl } from './baseUrl'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${authStore.token}`
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
