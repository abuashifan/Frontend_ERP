import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

export type ProductType = 'stock_item' | 'service'

export type Product = {
  id: number
  category_id?: number | null
  company_id: number
  parent_product_id?: number | null
  default_warehouse_id?: number | null
  preferred_vendor_id?: number | null

  inventory_account_id?: number | null
  sales_account_id?: number | null
  sales_discount_account_id?: number | null
  sales_return_account_id?: number | null
  purchase_return_account_id?: number | null
  cogs_account_id?: number | null
  unbilled_receipt_account_id?: number | null
  goods_in_transit_account_id?: number | null

  code: string
  name: string
  description?: string | null
  type: ProductType
  inventory_type?: string | null
  uom: string
  tax_code?: string | null
  use_serial_number?: boolean
  is_all_users_allowed?: boolean
  min_sales_price?: string | number | null
  max_sales_price?: string | number | null
  min_purchase_price?: string | number | null
  max_purchase_price?: string | number | null
  is_active: boolean
  on_hand_qty?: string | number
  category_name?: string | null
  created_at?: string
  updated_at?: string
}

export type CreateProductPayload = {
  code: string
  name: string
  description?: string | null
  category_id?: number | null
  parent_product_id?: number | null
  default_warehouse_id?: number | null
  preferred_vendor_id?: number | null

  inventory_account_id?: number | null
  sales_account_id?: number | null
  sales_discount_account_id?: number | null
  sales_return_account_id?: number | null
  purchase_return_account_id?: number | null
  cogs_account_id?: number | null
  unbilled_receipt_account_id?: number | null
  goods_in_transit_account_id?: number | null

  type: ProductType
  inventory_type?: string | null
  uom: string
  tax_code?: string | null
  use_serial_number?: boolean
  is_all_users_allowed?: boolean
  min_sales_price?: string | number | null
  max_sales_price?: string | number | null
  min_purchase_price?: string | number | null
  max_purchase_price?: string | number | null
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
