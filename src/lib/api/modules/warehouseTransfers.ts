import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList } from '../unwrap'

export type WarehouseTransferStatus = 'draft' | 'approved' | 'posted'

export type WarehouseTransferLine = {
  id?: number
  warehouse_transfer_id?: number
  product_id: number
  quantity: string | number
  serial_numbers?: string[]
  serials?: Array<{ id?: number; serial_number: string }>
}

export type WarehouseTransfer = {
  id: number
  transfer_number: string
  transfer_date: string
  source_warehouse_id: number
  destination_warehouse_id: number
  status: WarehouseTransferStatus
  description: string | null
  created_by: number
  approved_by: number | null
  posted_by: number | null
  lines?: WarehouseTransferLine[]
}

export type CreateWarehouseTransferPayload = {
  transfer_number: string
  transfer_date: string
  source_warehouse_id: number
  destination_warehouse_id: number
  description?: string | null
  lines: Array<{
    product_id: number
    quantity: string | number
    serial_numbers?: string[]
  }>
}

export async function listWarehouseTransfers(): Promise<WarehouseTransfer[]> {
  // Controller returns raw paginator, not wrapped in {data: ...}.
  const res: AxiosResponse<unknown> = await api.get('/warehouse-transfers')
  return unwrapList<WarehouseTransfer>(res.data)
}

export async function getWarehouseTransfer(id: number): Promise<WarehouseTransfer> {
  const res: AxiosResponse<unknown> = await api.get(`/warehouse-transfers/${id}`)
  return unwrapData<WarehouseTransfer>(res.data)
}

export async function createWarehouseTransfer(payload: CreateWarehouseTransferPayload): Promise<WarehouseTransfer> {
  const res: AxiosResponse<unknown> = await api.post('/warehouse-transfers', payload)
  return unwrapData<WarehouseTransfer>(res.data)
}

export async function updateWarehouseTransfer(
  id: number,
  payload: Partial<CreateWarehouseTransferPayload>,
): Promise<WarehouseTransfer> {
  const res: AxiosResponse<unknown> = await api.put(`/warehouse-transfers/${id}`, payload)
  return unwrapData<WarehouseTransfer>(res.data)
}

export async function approveWarehouseTransfer(id: number): Promise<WarehouseTransfer> {
  const res: AxiosResponse<unknown> = await api.post(`/warehouse-transfers/${id}/approve`)
  return unwrapData<WarehouseTransfer>(res.data)
}

export async function postWarehouseTransfer(id: number): Promise<WarehouseTransfer> {
  const res: AxiosResponse<unknown> = await api.post(`/warehouse-transfers/${id}/post`)
  return unwrapData<WarehouseTransfer>(res.data)
}
