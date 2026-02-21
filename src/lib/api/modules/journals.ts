import { api } from '../client'

export type JournalLine = {
  id: number
  journal_id: number
  account_id: number
  debit: string | number
  credit: string | number
  description: string | null
  account?: {
    id: number
    code: string
    name: string
  }
}

export type Journal = {
  id: number
  journal_number: string
  company_id: number
  period_id: number
  journal_date: string
  source_type: string
  source_id: number | null
  description: string
  status: string
  posted_at: string | null
  lines: JournalLine[]
}

export type ListJournalsResponse = {
  data: Journal[]
}

export type ListJournalsParams = {
  source_type?: string
  source_id?: number | string
  status?: string
  journal_number?: string
  date_from?: string
  date_to?: string
}

export async function listJournals(params: ListJournalsParams = {}) {
  const res = await api.get<ListJournalsResponse>('/journals', { params })
  return res.data.data
}

export type CreateJournalLinePayload = {
  account_id: number
  debit?: number | string | null
  credit?: number | string | null
  description?: string | null
  department_id?: number | null
  project_id?: number | null
}

export type CreateJournalPayload = {
  journal: {
    journal_number: string
    company_id: number
    period_id: number
    journal_date: string
    source_type: string
    source_id?: number | null
    description: string
  }
  lines: CreateJournalLinePayload[]
}

export type CreateJournalResponse = {
  data: Journal
}

export async function createJournal(payload: CreateJournalPayload) {
  const res = await api.post<CreateJournalResponse>('/journals', payload)
  return res.data.data
}
