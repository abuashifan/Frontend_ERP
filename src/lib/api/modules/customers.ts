import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

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

export type CreateCustomerPayload = {
  code: string
  name: string
  tax_id?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  is_active?: boolean
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

export async function listCustomers(): Promise<Customer[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Customer[]>> = await api.get('/customers', {
    params: { company_id: companyId },
  })
  return res.data.data
}

export async function getCustomer(id: number): Promise<Customer> {
  const res: AxiosResponse<ApiEnvelope<Customer>> = await api.get(`/customers/${id}`)
  return res.data.data
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Customer>> = await api.post('/customers', {
    company_id: companyId,
    ...payload,
  })
  return res.data.data
}

export async function updateCustomer(id: number, payload: UpdateCustomerPayload): Promise<Customer> {
  const res: AxiosResponse<ApiEnvelope<Customer>> = await api.put(`/customers/${id}`, payload)
  return res.data.data
}
