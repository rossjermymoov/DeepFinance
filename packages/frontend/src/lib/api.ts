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
  isLocked: boolean
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
  financialYear?: number
  periodNumber?: number
  createdAt?: string
  updatedAt?: string
}

export interface DashboardStats {
  totalAccounts: number
  totalJournals: number
  draftJournals: number
  postedJournals: number
  currentPeriod: FinancialPeriod | null
}

export interface Contact {
  id: string
  name: string
  contactType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH'
  email: string | null
  phone: string | null
  companyName: string | null
  taxNumber: string | null
  accountNumber: string | null
  defaultPaymentTermsDays: number
  billingAddress: {
    line1: string
    line2?: string
    city: string
    county?: string
    postcode: string
    country: string
  } | null
  currency: string
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceLine {
  id: string
  description: string
  accountId: string
  quantity: number
  unitPrice: number
  taxAmount: number
  lineTotal: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  contactId: string
  contact?: Contact
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID'
  currency: string
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  reference: string | null
  notes: string | null
  lines: InvoiceLine[]
  createdAt: string
  updatedAt: string
}

export interface BillLine {
  id: string
  description: string
  accountId: string
  quantity: number
  unitPrice: number
  taxAmount: number
  lineTotal: number
}

export interface Bill {
  id: string
  billNumber: string
  contactId: string
  contact?: Contact
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID'
  currency: string
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  reference: string | null
  notes: string | null
  lines: BillLine[]
  createdAt: string
  updatedAt: string
}

export interface TrialBalanceRow {
  accountId: string
  accountCode: string
  accountName: string
  accountType: string
  totalDebit: number
  totalCredit: number
  balance: number
}

export interface TaxRate {
  id: string
  name: string
  code: string
  rate: number
  description: string | null
  isDefault: boolean
  isActive: boolean
  effectiveFrom: string
  effectiveTo: string | null
  createdAt: string
  updatedAt: string
}

export interface BankTransaction {
  id: string
  bankAccountId: string
  transactionDate: string
  description: string
  reference: string | null
  amount: number
  balance: number | null
  type: 'CREDIT' | 'DEBIT'
  reconciliationStatus: 'UNRECONCILED' | 'MATCHED' | 'RECONCILED' | 'EXCLUDED'
  matchedJournalId: string | null
  importSource: string | null
  importBatchId: string | null
  createdAt: string
  updatedAt: string
}

export interface ReconciliationSummary {
  total: number
  unreconciled: number
  matched: number
  reconciled: number
  excluded: number
  unreconciledAmount: number
}

// VAT Types
export interface VatSettings {
  id: string
  vatNumber: string | null
  vatScheme: 'STANDARD' | 'FLAT_RATE' | 'CASH_ACCOUNTING'
  flatRatePercentage: number | null
  flatRateCategory: string | null
  returnFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  staggerGroup: number | null
  isRegistered: boolean
  registrationDate: string | null
  deregistrationDate: string | null
  hmrcClientId: string | null
  hmrcAccessToken: string | null  // just presence, not the actual value
  hmrcTokenExpiresAt: string | null
  lastSyncedAt: string | null
}

export interface VatReturn {
  id: string
  periodStart: string
  periodEnd: string
  dueDate: string
  status: 'DRAFT' | 'CALCULATED' | 'REVIEWED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED'
  vatSchemeUsed: string
  box1: number  // pence
  box2: number
  box3: number
  box4: number
  box5: number
  box6: number
  box7: number
  box8: number
  box9: number
  calculatedAt: string | null
  submittedAt: string | null
  hmrcReceiptId: string | null
  notes: string | null
  createdAt: string
}

export interface VatObligation {
  id: string
  periodStart: string
  periodEnd: string
  dueDate: string
  status: 'OPEN' | 'FULFILLED'
  hmrcPeriodKey: string | null
  receivedDate: string | null
  vatReturnId: string | null
}

// Payroll Types
export interface Employee {
  id: string
  employeeNumber: string
  title: string | null
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  niNumber: string | null
  taxCode: string
  niCategory: string
  payFrequency: 'WEEKLY' | 'FORTNIGHTLY' | 'FOUR_WEEKLY' | 'MONTHLY'
  basicPayRate: number
  payMethod: 'SALARY' | 'HOURLY'
  bankSortCode: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
  startDate: string
  leaveDate: string | null
  isDirector: boolean
  studentLoanPlan: 'NONE' | 'PLAN_1' | 'PLAN_2' | 'PLAN_4' | 'POSTGRAD'
  pensionOptOut: boolean
  pensionContributionPct: number
  employerPensionPct: number
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  county: string | null
  postcode: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  cumulativeGrossPay: number
  cumulativeTaxPaid: number
  cumulativeNiEmployee: number
  cumulativeNiEmployer: number
  previousEmploymentPay: number
  previousEmploymentTax: number
  createdAt: string
  updatedAt: string
}

export interface PayRun {
  id: string
  payRunNumber: string
  payFrequency: 'WEEKLY' | 'FORTNIGHTLY' | 'FOUR_WEEKLY' | 'MONTHLY'
  taxPeriod: number
  taxYear: string
  periodStart: string
  periodEnd: string
  paymentDate: string
  status: 'DRAFT' | 'CALCULATED' | 'REVIEWED' | 'SUBMITTED' | 'COMPLETED'
  totalGrossPay: number
  totalTaxDeducted: number
  totalNiEmployee: number
  totalNiEmployer: number
  totalStudentLoan: number
  totalPensionEmployee: number
  totalPensionEmployer: number
  totalNetPay: number
  employeeCount: number
  hmrcSubmissionId: string | null
  submittedAt: string | null
  notes: string | null
  createdAt: string
}

export interface Payslip {
  id: string
  payRunId: string
  employeeId: string
  employee?: Employee
  basicPay: number
  overtimePay: number
  bonusPay: number
  commissionPay: number
  grossPay: number
  taxableGross: number
  taxDeducted: number
  niEmployeeContribution: number
  niEmployerContribution: number
  studentLoanDeduction: number
  pensionEmployeeContribution: number
  pensionEmployerContribution: number
  otherDeductions: number
  otherAdditions: number
  netPay: number
  taxCode: string
  niCategory: string
  niablePay: number
  hoursWorked: number | null
  cumulativeGrossPay: number
  cumulativeTaxPaid: number
  cumulativeNiEmployee: number
  payMethod: string
  notes: string | null
}

export interface PayrollSettings {
  id: string
  employerPayeRef: string | null
  accountsOfficeRef: string | null
  employerName: string | null
  taxYear: string
  hmrcAccessToken: string | null
  hmrcTokenExpiresAt: string | null
  smallEmployerRelief: boolean
  employmentAllowanceClaimable: boolean
  employmentAllowanceClaimed: number
  lastRtiSubmissionAt: string | null
}

export interface PayrollSummary {
  totalEmployees: number
  activeEmployees: number
  currentPayRun: PayRun | null
  ytdGrossPay: number
  ytdTaxDeducted: number
  ytdNiTotal: number
}
