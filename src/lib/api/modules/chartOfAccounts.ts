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
  is_postable: boolean
  is_active: boolean
}

export async function listChartOfAccounts(): Promise<ChartOfAccount[]> {
  const tenantStore = useTenantStore()
  if (!tenantStore.activeCompanyId) {
    throw new Error('company_id belum diset. Set `VITE_COMPANY_ID` atau aktifkan tenant switcher.')
  }

  const companyId = Number(tenantStore.activeCompanyId)
  const res: AxiosResponse<ApiEnvelope<ChartOfAccount[]>> = await api.get('/chart-of-accounts', {
    params: { company_id: companyId, postable_only: true, active_only: true },
  })
  return res.data.data
}
