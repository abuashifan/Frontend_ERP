import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type PurchaseOrderStatus = 'draft' | 'approved' | 'cancelled'

export type PurchaseOrderLine = {
  id?: number
  purchase_order_id?: number
  product_id: number | null
  description: string
  qty: string | number
  unit_price: string | number
  tax_id?: number | null
}

export type PurchaseOrder = {
  id: number
  company_id: number
  vendor_id: number
  po_number: string
  po_date: string
  expected_date: string | null
  status: PurchaseOrderStatus
  subtotal: string
  tax_amount: string
  total_amount: string
  currency_code: string
  notes: string | null
  lines?: PurchaseOrderLine[]
}

export type CreatePurchaseOrderPayload = {
  vendor_id: number
  po_number: string
  po_date: string
  expected_date?: string | null
  currency_code: string
  tax_amount?: string | number
  notes?: string | null
  lines: Array<{
    product_id: number | null
    description: string
    qty: string | number
    unit_price: string | number
    tax_id?: number | null
  }>
}

export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<PurchaseOrder[]>> = await api.get('/purchase-orders', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<PurchaseOrder>(res.data)
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const res: AxiosResponse<ApiEnvelope<PurchaseOrder>> = await api.get(`/purchase-orders/${id}`)
  return unwrapData<PurchaseOrder>(res.data)
}

export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  const res: AxiosResponse<ApiEnvelope<PurchaseOrder>> = await api.post('/purchase-orders', body)
  return unwrapData<PurchaseOrder>(res.data)
}

export async function updatePurchaseOrder(
  id: number,
  payload: Partial<CreatePurchaseOrderPayload>,
): Promise<PurchaseOrder> {
  const res: AxiosResponse<ApiEnvelope<PurchaseOrder>> = await api.put(`/purchase-orders/${id}`, payload)
  return unwrapData<PurchaseOrder>(res.data)
}

export async function deletePurchaseOrder(id: number): Promise<void> {
  await api.delete(`/purchase-orders/${id}`)
}

export async function approvePurchaseOrder(id: number): Promise<PurchaseOrder> {
  const res: AxiosResponse<ApiEnvelope<PurchaseOrder>> = await api.post(`/purchase-orders/${id}/approve`)
  return unwrapData<PurchaseOrder>(res.data)
}

export async function cancelPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const res: AxiosResponse<ApiEnvelope<PurchaseOrder>> = await api.post(`/purchase-orders/${id}/cancel`)
  return unwrapData<PurchaseOrder>(res.data)
}
