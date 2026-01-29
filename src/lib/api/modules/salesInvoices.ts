import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

type SalesInvoiceCreateResponse = SalesInvoice | { invoice: SalesInvoice; journal: unknown }

export type SalesInvoiceStatus = 'draft' | 'approved' | 'cancelled' | 'partial' | 'paid'

export type SalesInvoiceLine = {
  id?: number
  sales_invoice_id?: number
  product_id: number | null
  description: string
  qty: string | number
  unit_price: string | number
  line_total?: string
  tax_id?: number | null
}

export type SalesInvoice = {
  id: number
  company_id: number
  customer_id: number
  warehouse_id: number | null
  invoice_number: string
  invoice_date: string
  due_date: string
  status: SalesInvoiceStatus
  currency_code: string
  exchange_rate: string
  subtotal: string
  tax_amount: string
  total_amount: string
  created_by: number
  approved_by: number | null
  approved_at: string | null
  posted_by: number | null
  posted_at: string | null
  source_type: string | null
  source_id: number | null
  lines: SalesInvoiceLine[]
  created_at?: string
  updated_at?: string
}

export type CreateSalesInvoicePayload = {
  customer_id: number
  warehouse_id?: number | null
  invoice_number: string
  invoice_date: string
  due_date: string
  currency_code: string
  exchange_rate?: number | string | null
  tax_amount?: number | string | null
  source_type?: string | null
  source_id?: number | null
  lines: SalesInvoiceLine[]
}

export type UpdateSalesInvoicePayload = Partial<Omit<CreateSalesInvoicePayload, 'lines'>> & {
  lines: SalesInvoiceLine[]
}

export async function listSalesInvoices(): Promise<SalesInvoice[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<SalesInvoice[]>> = await api.get('/sales-invoices', {
    params: { company_id: companyId },
  })
  return res.data.data
}

export async function getSalesInvoice(id: number): Promise<SalesInvoice> {
  const res: AxiosResponse<ApiEnvelope<SalesInvoice>> = await api.get(`/sales-invoices/${id}`)
  return res.data.data
}

export async function createSalesInvoice(
  payload: CreateSalesInvoicePayload,
  autoPost: boolean | undefined = undefined,
): Promise<SalesInvoice> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const body = {
    company_id: companyId,
    ...payload,
  } as any

  if (autoPost !== undefined) {
    body.auto_post = Boolean(autoPost)
  }

  const res: AxiosResponse<ApiEnvelope<SalesInvoiceCreateResponse>> = await api.post('/sales-invoices', body)
  const data = res.data.data
  if (data && typeof data === 'object' && 'invoice' in data) {
    return (data as { invoice: SalesInvoice }).invoice
  }
  return data as SalesInvoice
}

export async function updateSalesInvoice(
  id: number,
  payload: UpdateSalesInvoicePayload,
): Promise<SalesInvoice> {
  const res: AxiosResponse<ApiEnvelope<SalesInvoice>> = await api.put(`/sales-invoices/${id}`, payload)
  return res.data.data
}

export async function deleteSalesInvoice(id: number): Promise<void> {
  await api.delete(`/sales-invoices/${id}`)
}

export async function approveSalesInvoice(id: number): Promise<SalesInvoice> {
  const res: AxiosResponse<ApiEnvelope<SalesInvoice>> = await api.post(`/sales-invoices/${id}/approve`)
  return res.data.data
}

export async function postSalesInvoice(
  id: number,
  payload: { auto_approve?: boolean } = {},
): Promise<{ invoice: SalesInvoice; journal: unknown }> {
  const res: AxiosResponse<ApiEnvelope<{ invoice: SalesInvoice; journal: unknown }>> = await api.post(
    `/sales-invoices/${id}/post`,
    payload,
  )
  return res.data.data
}
