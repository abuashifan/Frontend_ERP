import type { AxiosResponse } from 'axios'

import { api } from '../client'
import { useTenantStore } from '../../../stores/tenant'

type ApiEnvelope<T> = {
  data: T
}

export type ChartOfAccount = {
  id: number
  company_id: number
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  normal_balance: 'debit' | 'credit'
  parent_id: number | null
  level: number
  is_postable: boolean
  is_active: boolean
}

export type ChartOfAccountWithBalance = ChartOfAccount & {
  total_debit: string
  total_credit: string
}

export type CreateChartOfAccountPayload = {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  normal_balance: 'debit' | 'credit'
  parent_id?: number | null
  level: number
  is_postable?: boolean
  is_active?: boolean
}

export type UpdateChartOfAccountPayload = Partial<CreateChartOfAccountPayload>

export type ListChartOfAccountsOptions = {
  postableOnly?: boolean
  activeOnly?: boolean
}

export async function listChartOfAccounts(options?: ListChartOfAccountsOptions): Promise<ChartOfAccount[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const postableOnly = options?.postableOnly ?? true
  const activeOnly = options?.activeOnly ?? true
  const res: AxiosResponse<ApiEnvelope<ChartOfAccount[]>> = await api.get('/chart-of-accounts', {
    // Laravel's boolean validator accepts 1/0 (and true/false), but querystring
    // serialization often produces "true"/"false" strings. Use 1/0 to be safe.
    params: { company_id: companyId, postable_only: postableOnly ? 1 : 0, active_only: activeOnly ? 1 : 0 },
  })
  return res.data.data
}

export async function listChartOfAccountsWithBalances(
  options?: ListChartOfAccountsOptions,
): Promise<ChartOfAccountWithBalance[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const postableOnly = options?.postableOnly ?? false
  const activeOnly = options?.activeOnly ?? false

  const res: AxiosResponse<ApiEnvelope<ChartOfAccountWithBalance[]>> = await api.get('/chart-of-accounts/balances', {
    params: { company_id: companyId, postable_only: postableOnly ? 1 : 0, active_only: activeOnly ? 1 : 0 },
  })
  return res.data.data
}

export async function getChartOfAccount(id: number): Promise<ChartOfAccount> {
  const res: AxiosResponse<ApiEnvelope<ChartOfAccount>> = await api.get(`/chart-of-accounts/${id}`)
  return res.data.data
}

export async function createChartOfAccount(payload: CreateChartOfAccountPayload): Promise<ChartOfAccount> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<ChartOfAccount>> = await api.post('/chart-of-accounts', {
    company_id: companyId,
    ...payload,
  })
  return res.data.data
}

export async function updateChartOfAccount(id: number, payload: UpdateChartOfAccountPayload): Promise<ChartOfAccount> {
  const res: AxiosResponse<ApiEnvelope<ChartOfAccount>> = await api.put(`/chart-of-accounts/${id}`, payload)
  return res.data.data
}

export async function deleteChartOfAccount(id: number): Promise<void> {
  await api.delete(`/chart-of-accounts/${id}`)
}
