import type { AxiosResponse } from 'axios'

import { api } from '../client'

type ApiEnvelope<T> = {
  data: T
}

export type SalesInvoiceCharge = {
  id: number
  sales_invoice_id: number
  description: string
  amount: string | number
  account_code: string
  is_discount: boolean
  created_at?: string
  updated_at?: string
}

export type CreateSalesInvoiceChargePayload = {
  description: string
  amount: number | string
  account_code: string
  is_discount: boolean
}

export async function listSalesInvoiceCharges(salesInvoiceId: number): Promise<SalesInvoiceCharge[]> {
  try {
    const res: AxiosResponse<ApiEnvelope<SalesInvoiceCharge[]>> = await api.get(
      `/ar/invoices/${salesInvoiceId}/charges`,
    )
    return res.data.data
  } catch (error: unknown) {
    // If endpoint doesn't exist (404), return empty array
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function createSalesInvoiceCharge(
  salesInvoiceId: number,
  payload: CreateSalesInvoiceChargePayload,
): Promise<SalesInvoiceCharge> {
  const res: AxiosResponse<ApiEnvelope<SalesInvoiceCharge>> = await api.post(
    `/ar/invoices/${salesInvoiceId}/charges`,
    payload,
  )
  return res.data.data
}

export async function deleteSalesInvoiceCharge(
  salesInvoiceId: number,
  chargeId: number,
): Promise<void> {
  await api.delete(`/ar/invoices/${salesInvoiceId}/charges/${chargeId}`)
}