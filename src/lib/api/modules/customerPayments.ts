import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type CustomerPaymentStatus = 'draft' | 'approved' | 'posted' | 'cancelled'

export type CustomerPaymentAllocation = {
  id?: number
  customer_payment_id?: number
  sales_invoice_id: number
  allocated_amount: string | number
}

export type CustomerPayment = {
  id: number
  company_id: number
  customer_id: number
  receipt_number: string
  receipt_date: string
  receipt_method: string
  status: CustomerPaymentStatus
  amount: string
  currency_code: string
  exchange_rate: string
  notes?: string | null
  source_type?: string | null
  source_id?: number | null
  allocations?: CustomerPaymentAllocation[]
}

export type CreateCustomerPaymentPayload = {
  customer_id: number
  receipt_number: string
  receipt_date: string
  receipt_method: string
  amount: string | number
  currency_code: string
  exchange_rate?: string | number | null
  notes?: string | null
  source_type?: string | null
  source_id?: number | null
  allocations: Array<{
    sales_invoice_id: number
    allocated_amount: string | number
  }>
}

export async function listCustomerPayments(): Promise<CustomerPayment[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<CustomerPayment[]>> = await api.get('/customer-payments', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<CustomerPayment>(res.data)
}

export async function getCustomerPayment(id: number): Promise<CustomerPayment> {
  const res: AxiosResponse<ApiEnvelope<CustomerPayment>> = await api.get(`/customer-payments/${id}`)
  return unwrapData<CustomerPayment>(res.data)
}

export async function createCustomerPayment(
  payload: CreateCustomerPaymentPayload,
  autoPost: boolean | undefined = undefined,
): Promise<CustomerPayment> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body: any = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  if (autoPost !== undefined) {
    body.auto_post = Boolean(autoPost)
  }

  const res: AxiosResponse<ApiEnvelope<unknown>> = await api.post('/customer-payments', body)
  const data = unwrapData<unknown>(res.data)
  if (data && typeof data === 'object' && 'payment' in (data as any)) {
    return (data as any).payment as CustomerPayment
  }
  return data as CustomerPayment
}

export async function updateCustomerPayment(
  id: number,
  payload: Partial<CreateCustomerPaymentPayload>,
): Promise<CustomerPayment> {
  const res: AxiosResponse<ApiEnvelope<CustomerPayment>> = await api.put(`/customer-payments/${id}`, payload)
  return unwrapData<CustomerPayment>(res.data)
}

export async function deleteCustomerPayment(id: number): Promise<void> {
  await api.delete(`/customer-payments/${id}`)
}

export async function approveCustomerPayment(id: number): Promise<CustomerPayment> {
  const res: AxiosResponse<ApiEnvelope<CustomerPayment>> = await api.post(`/customer-payments/${id}/approve`)
  return unwrapData<CustomerPayment>(res.data)
}

export async function postCustomerPayment(
  id: number,
  payload?: { auto_approve?: boolean },
): Promise<CustomerPayment> {
  const res: AxiosResponse<ApiEnvelope<CustomerPayment>> = await api.post(`/customer-payments/${id}/post`, payload ?? {})
  return unwrapData<CustomerPayment>(res.data)
}
