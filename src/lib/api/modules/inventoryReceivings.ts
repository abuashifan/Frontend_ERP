import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type InventoryReceivingStatus = 'draft' | 'posted'

export type InventoryReceivingLine = {
  id?: number
  receiving_id?: number
  product_id: number
  qty_received: string | number
  unit_cost: string | number
  bin_location?: string | null
  serial_numbers?: string[]
  serials?: Array<{ id?: number; serial_number: string }>
}

export type InventoryReceiving = {
  id: number
  company_id: number
  warehouse_id: number
  purchase_order_id: number | null
  vendor_invoice_id: number | null
  status: InventoryReceivingStatus
  received_at: string | null
  created_by: number
  posted_by: number | null
  posted_at: string | null
  serial_required_qty?: string | number
  serial_captured_qty?: string | number
  serial_is_required?: boolean | number
  serial_is_complete?: boolean | number
  lines?: InventoryReceivingLine[]
}

export type CreateInventoryReceivingPayload = {
  warehouse_id: number
  purchase_order_id?: number | null
  vendor_invoice_id?: number | null
  lines: Array<{
    product_id: number
    qty_received: string | number
    unit_cost: string | number
    bin_location?: string | null
    serial_numbers?: string[]
  }>
}

export async function listInventoryReceivings(): Promise<InventoryReceiving[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  // Controller currently returns raw paginator, not wrapped in {data: ...}.
  const res: AxiosResponse<unknown> = await api.get('/inventory-receivings', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<InventoryReceiving>(res.data)
}

export async function getInventoryReceiving(id: number): Promise<InventoryReceiving> {
  const res: AxiosResponse<unknown> = await api.get(`/inventory-receivings/${id}`)
  return unwrapData<InventoryReceiving>(res.data)
}

export async function createInventoryReceiving(
  payload: CreateInventoryReceivingPayload,
): Promise<InventoryReceiving> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  const res: AxiosResponse<unknown> = await api.post('/inventory-receivings', body)
  return unwrapData<InventoryReceiving>(res.data)
}

export async function updateInventoryReceiving(
  id: number,
  payload: CreateInventoryReceivingPayload,
): Promise<InventoryReceiving> {
  const res: AxiosResponse<unknown> = await api.put(`/inventory-receivings/${id}`, payload)
  return unwrapData<InventoryReceiving>(res.data)
}

export async function postInventoryReceiving(id: number): Promise<InventoryReceiving> {
  const res: AxiosResponse<unknown> = await api.post(`/inventory-receivings/${id}/post`)
  return unwrapData<InventoryReceiving>(res.data)
}
