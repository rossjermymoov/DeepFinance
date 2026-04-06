// In production, VITE_API_URL points to the backend's public URL (set at build time)
// In dev, Vite proxy handles /api → localhost:3000
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ── API Types ──────────────────────────────────────────────

export interface Account {
  id: string
  code: string
  name: string
  type: string
  subType: string | null
  description: string | null
  isActive: boolean
  isSystemAccount: boolean
  parentAccountId: string | null
  normalBalance: 'DEBIT' | 'CREDIT'
  currency: string
  taxRateId: string | null
  createdAt: string
  updatedAt: string
}

export interface JournalLine {
  id: string
  accountId: string
  account?: Account
  description: string | null
  debitAmount: number
  creditAmount: number
  currency: string
  exchangeRate: number
}

export interface Journal {
  id: string
  journalNumber: string
  date: string
  description: string
  reference: string | null
  status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'AMENDED'
  type: string
  currency: string
  totalDebitAmount: number
  totalCreditAmount: number
  lines: JournalLine[]
  isAmended: boolean
  amendedByJournalId: string | null
  amendsJournalId: string | null
  amendmentReason: string | null
  createdAt: string
  updatedAt: string
}

export interface FinancialPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'OPEN' | 'CLOSED' | 'LOCKED'
}

export interface DashboardStats {
  totalAccounts: number
  totalJournals: number
  draftJournals: number
  postedJournals: number
  currentPeriod: FinancialPeriod | null
}
