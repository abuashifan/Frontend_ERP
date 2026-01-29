import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

export type ProductCategory = {
  id: number
  company_id: number
  code: string
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CreateProductCategoryPayload = {
  code: string
  name: string
  is_active?: boolean
}

export type UpdateProductCategoryPayload = Partial<CreateProductCategoryPayload>

export async function listProductCategories(): Promise<ProductCategory[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<ProductCategory[]>> = await api.get('/product-categories', {
    params: { company_id: companyId },
  })
  return res.data.data
}

export async function createProductCategory(payload: CreateProductCategoryPayload): Promise<ProductCategory> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<ProductCategory>> = await api.post('/product-categories', {
    company_id: companyId,
    ...payload,
  })
  return res.data.data
}

export async function updateProductCategory(id: number, payload: UpdateProductCategoryPayload): Promise<ProductCategory> {
  const res: AxiosResponse<ApiEnvelope<ProductCategory>> = await api.put(`/product-categories/${id}`, payload)
  return res.data.data
}

export async function getProductCategory(id: number): Promise<ProductCategory> {
  const res: AxiosResponse<ApiEnvelope<ProductCategory>> = await api.get(`/product-categories/${id}`)
  return res.data.data
}
