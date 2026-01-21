import type { AxiosResponse } from 'axios'

import { api } from '../client'

type ApiEnvelope<T> = {
  data: T
}

export type Customer = {
  id: number
  company_id: number
  code: string
  name: string
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export async function listCustomers(): Promise<Customer[]> {
  const res: AxiosResponse<ApiEnvelope<Customer[]>> = await api.get('/customers')
  return res.data.data
}

export async function getCustomer(id: number): Promise<Customer> {
  const res: AxiosResponse<ApiEnvelope<Customer>> = await api.get(`/customers/${id}`)
  return res.data.data
}
