import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

export type Warehouse = {
  id: number
  company_id: number
  code: string
  name: string
  address: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CreateWarehousePayload = {
  code: string
  name: string
  address?: string | null
  is_active?: boolean
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>

export async function listWarehouses(): Promise<Warehouse[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Warehouse[]>> = await api.get('/warehouses', {
    params: { company_id: companyId },
  })
  return res.data.data
}

export async function getWarehouse(id: number): Promise<Warehouse> {
  const res: AxiosResponse<ApiEnvelope<Warehouse>> = await api.get(`/warehouses/${id}`)
  return res.data.data
}

export async function createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Warehouse>> = await api.post('/warehouses', {
    company_id: companyId,
    ...payload,
  })
  return res.data.data
}

export async function updateWarehouse(id: number, payload: UpdateWarehousePayload): Promise<Warehouse> {
  const res: AxiosResponse<ApiEnvelope<Warehouse>> = await api.put(`/warehouses/${id}`, payload)
  return res.data.data
}
