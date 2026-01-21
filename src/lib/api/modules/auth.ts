import { api } from '../client'

export type LoginPayload = {
  email: string
  password: string
  device_name?: string
  remember?: boolean
}

export type LoginResponse = {
  data: {
    token: string
    user: {
      id: number
      name: string
      email: string
    }
  }
}

export async function loginWithPassword(payload: LoginPayload) {
  const res = await api.post<LoginResponse>('/auth/login', {
    email: payload.email,
    password: payload.password,
    device_name: payload.device_name ?? 'erp',
  })
  return res.data
}

export async function logout() {
  const res = await api.post('/auth/logout')
  return res.data
}
