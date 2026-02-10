import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { unwrapData } from '../unwrap'

type ApiEnvelope<T> = {
  data: T
}

export type ProductUnit = {
  id: number
  product_id: number
  unit_name: string
  ratio: string | number
  price_level_1?: string | number | null
  price_level_2?: string | number | null
  price_level_3?: string | number | null
  price_level_4?: string | number | null
  price_level_5?: string | number | null
  is_base_unit: boolean
  created_at?: string
  updated_at?: string
}

export type CreateProductUnitPayload = {
  unit_name: string
  ratio: string | number
  price_level_1?: string | number | null
  price_level_2?: string | number | null
  price_level_3?: string | number | null
  price_level_4?: string | number | null
  price_level_5?: string | number | null
  is_base_unit?: boolean
}

export type UpdateProductUnitPayload = Partial<CreateProductUnitPayload>

export async function listProductUnits(productId: number): Promise<ProductUnit[]> {
  const res: AxiosResponse<ApiEnvelope<ProductUnit[]>> = await api.get(`/products/${productId}/units`)
  return res.data.data
}

export async function createProductUnit(productId: number, payload: CreateProductUnitPayload): Promise<ProductUnit> {
  const res: AxiosResponse<unknown> = await api.post(`/products/${productId}/units`, payload)
  return unwrapData<ProductUnit>(res.data)
}

export async function updateProductUnit(id: number, payload: UpdateProductUnitPayload): Promise<ProductUnit> {
  const res: AxiosResponse<unknown> = await api.put(`/product-units/${id}`, payload)
  return unwrapData<ProductUnit>(res.data)
}

export async function deleteProductUnit(id: number): Promise<void> {
  await api.delete(`/product-units/${id}`)
}
