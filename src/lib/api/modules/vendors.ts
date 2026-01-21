import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

export type Vendor = {
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

export async function listVendors(): Promise<Vendor[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Vendor[]>> = await api.get('/vendors', {
    params: { company_id: companyId },
  })
  return res.data.data
}

export async function getVendor(id: number): Promise<Vendor> {
  const res: AxiosResponse<ApiEnvelope<Vendor>> = await api.get(`/vendors/${id}`)
  return res.data.data
}
