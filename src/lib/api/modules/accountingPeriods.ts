import { api } from '../client'

export type ResolveAccountingPeriodResponse = {
  data: {
    company_id: number
    date: string
    period: {
      id: number
      year: number
      month: number
      start_date: string | null
      end_date: string | null
      status: string
      is_open: boolean
    }
  }
}

export async function resolveAccountingPeriod(date?: string) {
  const res = await api.get<ResolveAccountingPeriodResponse>('/accounting-periods/resolve', {
    params: { date: date || undefined },
  })
  return res.data.data
}
