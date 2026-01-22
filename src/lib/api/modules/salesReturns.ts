import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type SalesReturnStatus = 'draft' | 'approved' | 'posted'

export type SalesReturnLine = {
  id?: number
  sales_return_id?: number
  product_id: number
  quantity: string | number
  unit_price: string | number
  total?: string
}

export type SalesReturn = {
  id: number
  company_id: number
  customer_id: number
  sales_invoice_id: number
  warehouse_id: number
  reference: string | null
  date: string | null
  status: SalesReturnStatus
  subtotal: string
  tax_amount: string
  total_amount: string
  currency_code: string
  exchange_rate: string
  lines?: SalesReturnLine[]
}

export type CreateSalesReturnPayload = {
  customer_id: number
  sales_invoice_id: number
  warehouse_id: number
  reference?: string | null
  date?: string | null
  currency_code?: string
  exchange_rate?: string | number | null
  tax_amount?: string | number
  lines: Array<{
    product_id: number
    quantity: string | number
    unit_price: string | number
  }>
}

export async function listSalesReturns(): Promise<SalesReturn[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<unknown>> = await api.get('/sales-returns', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<SalesReturn>(res.data)
}

export async function getSalesReturn(id: number): Promise<SalesReturn> {
  const res: AxiosResponse<ApiEnvelope<SalesReturn>> = await api.get(`/sales-returns/${id}`)
  return unwrapData<SalesReturn>(res.data)
}

export async function createSalesReturn(payload: CreateSalesReturnPayload): Promise<SalesReturn> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  const res: AxiosResponse<ApiEnvelope<SalesReturn>> = await api.post('/sales-returns', body)
  return unwrapData<SalesReturn>(res.data)
}

export async function approveSalesReturn(id: number): Promise<SalesReturn> {
  const res: AxiosResponse<ApiEnvelope<SalesReturn>> = await api.post(`/sales-returns/${id}/approve`)
  return unwrapData<SalesReturn>(res.data)
}

export async function postSalesReturn(id: number): Promise<SalesReturn> {
  const res: AxiosResponse<ApiEnvelope<SalesReturn>> = await api.post(`/sales-returns/${id}/post`)
  return unwrapData<SalesReturn>(res.data)
}
