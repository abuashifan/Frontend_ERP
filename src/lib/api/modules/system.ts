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
      fiscal_year_start_year: number
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
  fiscal_year_start_year: number
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
      fiscal_year_start_year: number
      timezone: string
      is_active: boolean
    }
  }
}

export async function setupCompany(payload: SetupCompanyPayload) {
  const res = await api.post<SetupCompanyResponse>('/system/setup/company', payload)
  return res.data
}

export type EnsurePeriodsResponse = {
  data: {
    company_id: number
    timezone: string
    window: {
      years_back: number
      years_forward: number
    }
    inserted: number
    skipped_existing: number
  }
}

export async function ensureAccountingPeriods(yearsBack = 1, yearsForward = 1) {
  const res = await api.post<EnsurePeriodsResponse>('/system/company/periods/ensure', {
    years_back: yearsBack,
    years_forward: yearsForward,
  })
  return res.data
}
