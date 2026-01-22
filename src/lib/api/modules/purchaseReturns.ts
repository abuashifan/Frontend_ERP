import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type PurchaseReturnStatus = 'draft' | 'approved' | 'posted'

export type PurchaseReturnLine = {
  id?: number
  purchase_return_id?: number
  product_id: number
  quantity: string | number
  unit_price: string | number
  total?: string
}

export type PurchaseReturn = {
  id: number
  company_id: number
  vendor_id: number
  purchase_invoice_id: number | null
  reference: string | null
  date: string | null
  status: PurchaseReturnStatus
  total_amount: string
  lines?: PurchaseReturnLine[]
}

export type CreatePurchaseReturnPayload = {
  vendor_id: number
  purchase_invoice_id?: number | null
  reference?: string | null
  date?: string | null
  total_amount?: string | number
  lines: Array<{
    product_id: number
    quantity: string | number
    unit_price: string | number
  }>
}

export async function listPurchaseReturns(): Promise<PurchaseReturn[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<unknown>> = await api.get('/purchase-returns', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<PurchaseReturn>(res.data)
}

export async function getPurchaseReturn(id: number): Promise<PurchaseReturn> {
  const res: AxiosResponse<ApiEnvelope<PurchaseReturn>> = await api.get(`/purchase-returns/${id}`)
  return unwrapData<PurchaseReturn>(res.data)
}

export async function createPurchaseReturn(payload: CreatePurchaseReturnPayload): Promise<PurchaseReturn> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  const res: AxiosResponse<ApiEnvelope<PurchaseReturn>> = await api.post('/purchase-returns', body)
  return unwrapData<PurchaseReturn>(res.data)
}

export async function approvePurchaseReturn(id: number): Promise<PurchaseReturn> {
  const res: AxiosResponse<ApiEnvelope<PurchaseReturn>> = await api.post(`/purchase-returns/${id}/approve`)
  return unwrapData<PurchaseReturn>(res.data)
}

export async function postPurchaseReturn(id: number): Promise<PurchaseReturn> {
  const res: AxiosResponse<ApiEnvelope<PurchaseReturn>> = await api.post(`/purchase-returns/${id}/post`)
  return unwrapData<PurchaseReturn>(res.data)
}
