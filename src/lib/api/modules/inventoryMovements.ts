import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData, unwrapList, type ApiEnvelope } from '../unwrap'
import { useTenantStore } from '../../../stores/tenant'

export type InventoryMovementType = 'in' | 'out'
export type InventoryMovementStatus = 'draft' | 'posted'

export type InventoryMovementLine = {
  id?: number
  inventory_movement_id?: number
  product_id: number
  qty: string | number
  unit_cost?: string | number | null
  description?: string | null
}

export type InventoryMovement = {
  id: number
  company_id: number
  warehouse_id: number
  movement_number: string
  movement_date: string
  type: InventoryMovementType
  status: InventoryMovementStatus
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  lines?: InventoryMovementLine[]
}

export type CreateInventoryMovementPayload = {
  warehouse_id: number
  movement_number: string
  movement_date: string
  type: InventoryMovementType
  reference_type?: string | null
  reference_id?: number | null
  notes?: string | null
  lines: Array<{
    product_id: number
    qty: string | number
    unit_cost?: string | number | null
    description?: string | null
  }>
}

export type ProductInventoryMovementRow = {
  date: string
  qty_in: string
  qty_out: string
  ending_balance: string
  invoice_number: string
  source: string
  reference_type: string | null
  reference_id: number | null
}

export type ProductInventoryMovementsResponse = {
  opening_balance: string
  data: ProductInventoryMovementRow[]
}

export async function listInventoryMovements(): Promise<InventoryMovement[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ApiEnvelope<InventoryMovement[]>> = await api.get('/inventory-movements', {
    params: { company_id: Number(tenantStore.activeCompanyId) },
  })

  return unwrapList<InventoryMovement>(res.data)
}

export async function getInventoryMovement(id: number): Promise<InventoryMovement> {
  const res: AxiosResponse<ApiEnvelope<InventoryMovement>> = await api.get(`/inventory-movements/${id}`)
  return unwrapData<InventoryMovement>(res.data)
}

export async function createInventoryMovement(
  payload: CreateInventoryMovementPayload,
): Promise<InventoryMovement> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const body = {
    ...payload,
    company_id: Number(tenantStore.activeCompanyId),
  }

  const res: AxiosResponse<ApiEnvelope<InventoryMovement>> = await api.post('/inventory-movements', body)
  return unwrapData<InventoryMovement>(res.data)
}

export async function updateInventoryMovement(
  id: number,
  payload: Partial<CreateInventoryMovementPayload>,
): Promise<InventoryMovement> {
  const res: AxiosResponse<ApiEnvelope<InventoryMovement>> = await api.put(`/inventory-movements/${id}`, payload)
  return unwrapData<InventoryMovement>(res.data)
}

export async function deleteInventoryMovement(id: number): Promise<void> {
  await api.delete(`/inventory-movements/${id}`)
}

export async function postInventoryMovement(id: number): Promise<InventoryMovement> {
  const res: AxiosResponse<ApiEnvelope<InventoryMovement>> = await api.post(`/inventory-movements/${id}/post`)
  return unwrapData<InventoryMovement>(res.data)
}

export async function getProductInventoryMovements(
  productId: number,
  params?: { from_date?: string; to_date?: string },
): Promise<ProductInventoryMovementsResponse> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) throw new Error('company_id belum diset')

  const res: AxiosResponse<ProductInventoryMovementsResponse> = await api.get(
    `/products/${productId}/inventory-movements`,
    {
      params: {
        company_id: Number(tenantStore.activeCompanyId),
        ...params,
      },
    },
  )

  return res.data
}
