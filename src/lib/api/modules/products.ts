import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

export type ProductType = 'stock_item' | 'service'

export type Product = {
  id: number
  company_id: number
  code: string
  name: string
  type: ProductType
  uom: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CreateProductPayload = {
  code: string
  name: string
  type: ProductType
  uom: string
  is_active?: boolean
}

export type UpdateProductPayload = Partial<CreateProductPayload>

export async function listProducts(): Promise<Product[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Product[]>> = await api.get('/products', {
    params: { company_id: companyId },
  })
  return res.data.data
}

export async function getProduct(id: number): Promise<Product> {
  const res: AxiosResponse<ApiEnvelope<Product>> = await api.get(`/products/${id}`)
  return res.data.data
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<Product>> = await api.post('/products', {
    company_id: companyId,
    ...payload,
  })
  return res.data.data
}

export async function updateProduct(id: number, payload: UpdateProductPayload): Promise<Product> {
  const res: AxiosResponse<ApiEnvelope<Product>> = await api.put(`/products/${id}`, payload)
  return res.data.data
}
