import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type VendorInvoiceStatus = 'draft' | 'approved' | 'posted' | 'cancelled'

export type VendorInvoiceLine = {
  id?: number
  vendor_invoice_id?: number
  product_id: number | null
  description: string
  qty: string | number
  unit_price: string | number
  tax_id?: number | null
}

export type VendorInvoice = {
  id: number
  company_id: number
  vendor_id: number
  purchase_order_id: number | null
  invoice_number: string
  invoice_date: string
  due_date: string
  status: VendorInvoiceStatus
  currency_code: string
  exchange_rate: string
  subtotal: string
  tax_amount: string
  total_amount: string
  source_type?: string | null
  source_id?: number | null
  notes?: string | null
  lines?: VendorInvoiceLine[]
}

export type CreateVendorInvoicePayload = {
  vendor_id: number
  purchase_order_id?: number | null
  invoice_number: string
  invoice_date: string
  due_date: string
  currency_code: string
  exchange_rate?: string | number | null
  tax_amount?: string | number
  source_type?: string | null
  source_id?: number | null
  notes?: string | null
  lines: Array<{
    product_id: number | null
    description: string
    qty: string | number
    unit_price: string | number
    tax_id?: number | null
  }>
}

export async function listVendorInvoices(): Promise<VendorInvoice[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<VendorInvoice[]>> = await api.get('/vendor-invoices', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<VendorInvoice>(res.data)
}

export async function getVendorInvoice(id: number): Promise<VendorInvoice> {
  const res: AxiosResponse<ApiEnvelope<VendorInvoice>> = await api.get(`/vendor-invoices/${id}`)
  return unwrapData<VendorInvoice>(res.data)
}

export async function createVendorInvoice(
  payload: CreateVendorInvoicePayload,
  autoPost: boolean | undefined = undefined,
): Promise<VendorInvoice> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body: any = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  if (autoPost !== undefined) {
    body.auto_post = Boolean(autoPost)
  }

  const res: AxiosResponse<ApiEnvelope<unknown>> = await api.post('/vendor-invoices', body)
  const data = unwrapData<unknown>(res.data)

  if (data && typeof data === 'object' && 'invoice' in (data as any)) {
    return (data as any).invoice as VendorInvoice
  }

  return data as VendorInvoice
}

export async function updateVendorInvoice(
  id: number,
  payload: Partial<CreateVendorInvoicePayload>,
): Promise<VendorInvoice> {
  const res: AxiosResponse<ApiEnvelope<VendorInvoice>> = await api.put(`/vendor-invoices/${id}`, payload)
  return unwrapData<VendorInvoice>(res.data)
}

export async function deleteVendorInvoice(id: number): Promise<void> {
  await api.delete(`/vendor-invoices/${id}`)
}

export async function approveVendorInvoice(id: number): Promise<VendorInvoice> {
  const res: AxiosResponse<ApiEnvelope<VendorInvoice>> = await api.post(`/vendor-invoices/${id}/approve`)
  return unwrapData<VendorInvoice>(res.data)
}

export async function postVendorInvoice(
  id: number,
  payload?: { auto_approve?: boolean },
): Promise<VendorInvoice> {
  const res: AxiosResponse<ApiEnvelope<VendorInvoice>> = await api.post(`/vendor-invoices/${id}/post`, payload ?? {})
  return unwrapData<VendorInvoice>(res.data)
}
