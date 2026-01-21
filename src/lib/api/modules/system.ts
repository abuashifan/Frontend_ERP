import { api } from '../client'

export type BootstrapResponse = {
  data: {
    setupRequired: boolean
    companiesCount: number
    singleCompanyId: number | null
    company: {
      id: number
      code: string
      name: string
      base_currency: string
      fiscal_year_start_month: number
      timezone: string
      is_active: boolean
    } | null
  }
}

export async function getBootstrap() {
  const res = await api.get<BootstrapResponse>('/system/bootstrap')
  return res.data
}

export type SetupCompanyPayload = {
  name: string
  code?: string
  base_currency?: string
  fiscal_year_start_month?: number
  timezone?: string
  profile?: Record<string, unknown>
}

export type SetupCompanyResponse = {
  data: {
    singleCompanyId: number
    company: {
      id: number
      code: string
      name: string
      base_currency: string
      fiscal_year_start_month: number
      timezone: string
      is_active: boolean
    }
  }
}

export async function setupCompany(payload: SetupCompanyPayload) {
  const res = await api.post<SetupCompanyResponse>('/system/setup/company', payload)
  return res.data
}
