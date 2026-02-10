import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type VendorPaymentStatus = 'draft' | 'approved' | 'posted' | 'cancelled'

export type VendorPaymentAllocation = {
  id?: number
  vendor_payment_id?: number
  vendor_invoice_id: number
  allocated_amount: string | number
}

export type VendorPayment = {
  id: number
  company_id: number
  vendor_id: number
  payment_number: string
  payment_date: string
  payment_method: string
  status: VendorPaymentStatus
  amount: string
  currency_code: string
  exchange_rate: string
  notes?: string | null
  source_type?: string | null
  source_id?: number | null
  allocations?: VendorPaymentAllocation[]
}

export type CreateVendorPaymentPayload = {
  vendor_id: number
  payment_number: string
  payment_date: string
  payment_method: string
  amount: string | number
  currency_code: string
  exchange_rate?: string | number | null
  notes?: string | null
  source_type?: string | null
  source_id?: number | null
  allocations: Array<{
    vendor_invoice_id: number
    allocated_amount: string | number
  }>
}

export async function listVendorPayments(): Promise<VendorPayment[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<VendorPayment[]>> = await api.get('/vendor-payments', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<VendorPayment>(res.data)
}

export async function getVendorPayment(id: number): Promise<VendorPayment> {
  const res: AxiosResponse<ApiEnvelope<VendorPayment>> = await api.get(`/vendor-payments/${id}`)
  return unwrapData<VendorPayment>(res.data)
}

export async function createVendorPayment(
  payload: CreateVendorPaymentPayload,
  autoPost: boolean | undefined = undefined,
): Promise<VendorPayment> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body: any = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  if (autoPost !== undefined) {
    body.auto_post = Boolean(autoPost)
  }

  const res: AxiosResponse<ApiEnvelope<unknown>> = await api.post('/vendor-payments', body)
  const data = unwrapData<unknown>(res.data)
  if (data && typeof data === 'object' && 'payment' in (data as any)) {
    return (data as any).payment as VendorPayment
  }
  return data as VendorPayment
}

export async function updateVendorPayment(
  id: number,
  payload: Partial<CreateVendorPaymentPayload>,
): Promise<VendorPayment> {
  const res: AxiosResponse<ApiEnvelope<VendorPayment>> = await api.put(`/vendor-payments/${id}`, payload)
  return unwrapData<VendorPayment>(res.data)
}

export async function deleteVendorPayment(id: number): Promise<void> {
  await api.delete(`/vendor-payments/${id}`)
}

export async function approveVendorPayment(id: number): Promise<VendorPayment> {
  const res: AxiosResponse<ApiEnvelope<VendorPayment>> = await api.post(`/vendor-payments/${id}/approve`)
  return unwrapData<VendorPayment>(res.data)
}

export async function postVendorPayment(
  id: number,
  payload?: { auto_approve?: boolean },
): Promise<VendorPayment> {
  const res: AxiosResponse<ApiEnvelope<VendorPayment>> = await api.post(`/vendor-payments/${id}/post`, payload ?? {})
  return unwrapData<VendorPayment>(res.data)
}
