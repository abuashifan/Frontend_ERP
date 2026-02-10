import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapList, type ApiEnvelope, type Paginator } from '../unwrap'

export type ProductSerialStatus = 'available' | 'sold' | string

export type ProductSerial = {
  id: number
  company_id: number
  product_id: number
  serial_number: string
  status: ProductSerialStatus

  warehouse_id?: number | null
  received_at?: string | null
  sold_at?: string | null
  sold_source_type?: string | null
  sold_source_id?: number | null

  created_at?: string
  updated_at?: string

  product?: { id: number; company_id?: number; code: string; name: string } | null
  warehouse?: { id: number; company_id?: number; code: string; name: string } | null
}

export type ListProductSerialsParams = {
  q?: string
  status?: string
  product_id?: number
  warehouse_id?: number
  per_page?: number
  sort?: 'id_desc' | 'id_asc' | 'serial_asc' | 'serial_desc' | 'received_desc' | 'received_asc'
}

export type ListAvailableProductSerialNumbersParams = {
  product_id: number
  warehouse_id: number
  q?: string
  limit?: number
}

export async function listProductSerials(params?: ListProductSerialsParams): Promise<ProductSerial[]> {
  // Controller returns { data: paginator } envelope.
  const res: AxiosResponse<ApiEnvelope<Paginator<ProductSerial>>> = await api.get('/product-serials', {
    params,
  })
  return unwrapList<ProductSerial>(res.data)
}

export async function listAvailableProductSerialNumbers(
  params: ListAvailableProductSerialNumbersParams,
): Promise<string[]> {
  const res: AxiosResponse<ApiEnvelope<string[]>> = await api.get('/product-serials/available', { params })
  return Array.isArray(res.data.data) ? res.data.data : []
}
