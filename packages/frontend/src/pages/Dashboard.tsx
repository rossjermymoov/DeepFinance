import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  FilePenLine,
  FileCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Receipt,
  CreditCard,
  ArrowRight,
  Clock,
  PoundSterling,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  api,
  type Journal,
  type Account,
  type FinancialPeriod,
  type Invoice,
  type Bill,
  type Contact,
} from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconColor?: string
  link?: string
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor, link }: StatCardProps) {
  const content = (
    <Card className={link ? 'hover:border-primary/30 transition-colors cursor-pointer' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'POSTED':
      return <Badge variant="success">{status}</Badge>
    case 'DRAFT':
      return <Badge variant="warning">{status}</Badge>
    case 'REVERSED':
    case 'AMENDED':
      return <Badge variant="error">{status}</Badge>
    case 'OPEN':
      return <Badge variant="success">{status}</Badge>
    case 'CLOSED':
      return <Badge variant="error">{status}</Badge>
    case 'LOCKED':
      return <Badge variant="warning">{status}</Badge>
    case 'PAID':
      return <Badge variant="success">{status}</Badge>
    case 'PARTIALLY_PAID':
      return <Badge variant="warning">PARTIAL</Badge>
    case 'OVERDUE':
      return <Badge variant="error">{status}</Badge>
    case 'SENT':
    case 'APPROVED':
      return <Badge variant="secondary">{status}</Badge>
    case 'VOID':
      return <Badge variant="error">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        const [accountsRes, journalsRes, periodsRes, invoicesRes, billsRes, contactsRes] =
          await Promise.allSettled([
            api.get<Account[]>('/accounts'),
            api.get<Journal[]>('/journals'),
            api.get<FinancialPeriod[]>('/periods'),
            api.get<{ data: Invoice[] } | Invoice[]>('/invoices'),
            api.get<{ data: Bill[] } | Bill[]>('/bills'),
            api.get<{ data: Contact[] } | Contact[]>('/contacts'),
          ])

        if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value)
        if (journalsRes.status === 'fulfilled') setJournals(journalsRes.value)
        if (periodsRes.status === 'fulfilled') setPeriods(periodsRes.value)
        if (invoicesRes.status === 'fulfilled') {
          const val = invoicesRes.value
          setInvoices(Array.isArray(val) ? val : (val as { data: Invoice[] }).data || [])
        }
        if (billsRes.status === 'fulfilled') {
          const val = billsRes.value
          setBills(Array.isArray(val) ? val : (val as { data: Bill[] }).data || [])
        }
        if (contactsRes.status === 'fulfilled') {
          const val = contactsRes.value
          setContacts(Array.isArray(val) ? val : (val as { data: Contact[] }).data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  // Journal metrics
  const draftCount = journals.filter((j) => j.status === 'DRAFT').length
  const postedCount = journals.filter((j) => j.status === 'POSTED').length
  const currentPeriod = periods.find((p) => p.status === 'OPEN')

  // AR metrics (Invoices)
  const outstandingInvoices = invoices.filter((i) =>
    ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status)
  )
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE')
  const totalReceivable = outstandingInvoices.reduce(
    (sum, i) => sum + (i.total - i.amountPaid),
    0
  )
  const totalOverdueReceivable = overdueInvoices.reduce(
    (sum, i) => sum + (i.total - i.amountPaid),
    0
  )

  // AP metrics (Bills)
  const outstandingBills = bills.filter((b) =>
    ['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status)
  )
  const overdueBills = bills.filter((b) => b.status === 'OVERDUE')
  const totalPayable = outstandingBills.reduce(
    (sum, b) => sum + (b.total - b.amountPaid),
    0
  )
  const totalOverduePayable = overdueBills.reduce(
    (sum, b) => sum + (b.total - b.amountPaid),
    0
  )

  // Net position
  const netPosition = totalReceivable - totalPayable

  // Recent journals
  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Recent bills
  const recentBills = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Account type breakdown
  const accountsByType = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Financial overview for your organisation
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-status-amber bg-status-amber/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-4 w-4 text-status-amber" />
            <span className="text-sm text-status-amber">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Overdue warning banner */}
      {(overdueInvoices.length > 0 || overdueBills.length > 0) && (
        <Card className="border-status-red bg-status-red/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-4 w-4 text-status-red" />
            <span className="text-sm text-status-red">
              {overdueInvoices.length > 0 && (
                <span>
                  {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? 's' : ''} ({formatCurrency(totalOverdueReceivable)})
                </span>
              )}
              {overdueInvoices.length > 0 && overdueBills.length > 0 && <span> · </span>}
              {overdueBills.length > 0 && (
                <span>
                  {overdueBills.length} overdue bill{overdueBills.length !== 1 ? 's' : ''} ({formatCurrency(totalOverduePayable)})
                </span>
              )}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Key financial metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Accounts Receivable"
          value={formatCurrency(totalReceivable)}
          subtitle={`${outstandingInvoices.length} outstanding invoice${outstandingInvoices.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          iconColor="text-status-green"
          link="/invoices"
        />
        <StatCard
          title="Accounts Payable"
          value={formatCurrency(totalPayable)}
          subtitle={`${outstandingBills.length} outstanding bill${outstandingBills.length !== 1 ? 's' : ''}`}
          icon={TrendingDown}
          iconColor="text-status-red"
          link="/bills"
        />
        <StatCard
          title="Net Position"
          value={formatCurrency(netPosition)}
          subtitle={netPosition >= 0 ? 'Receivables exceed payables' : 'Payables exceed receivables'}
          icon={PoundSterling}
          iconColor={netPosition >= 0 ? 'text-status-green' : 'text-status-red'}
        />
        <StatCard
          title="Current Period"
          value={currentPeriod?.name || 'None open'}
          subtitle={
            currentPeriod
              ? `${formatDate(currentPeriod.startDate)} – ${formatDate(currentPeriod.endDate)}`
              : 'No open period'
          }
          icon={Calendar}
          link="/periods"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={accounts.length}
          subtitle={`${Object.keys(accountsByType).length} account types`}
          icon={BookOpen}
          link="/accounts"
        />
        <StatCard
          title="Journal Entries"
          value={journals.length}
          subtitle={draftCount > 0 ? `${draftCount} draft, ${postedCount} posted` : `${postedCount} posted`}
          icon={FileText}
          link="/journals"
        />
        <StatCard
          title="Contacts"
          value={contacts.length}
          subtitle={`${contacts.filter(c => c.contactType === 'CUSTOMER' || c.contactType === 'BOTH').length} customers, ${contacts.filter(c => c.contactType === 'SUPPLIER' || c.contactType === 'BOTH').length} suppliers`}
          icon={Users}
          link="/contacts"
        />
        <StatCard
          title="Draft Journals"
          value={draftCount}
          subtitle="Awaiting posting"
          icon={FilePenLine}
          iconColor={draftCount > 0 ? 'text-status-amber' : undefined}
          link="/journals"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent journals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Journal Entries</CardTitle>
            <Link
              to="/journals"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentJournals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No journal entries yet. Create your first journal to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {recentJournals.map((journal) => (
                  <div
                    key={journal.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {journal.journalNumber}
                          {journal.description && (
                            <span className="text-muted-foreground font-normal ml-2">
                              — {journal.description}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(journal.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-sm font-mono">
                        {formatCurrency(journal.totalDebitAmount)}
                      </span>
                      <StatusBadge status={journal.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Outstanding invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Outstanding Invoices
              </CardTitle>
              <Link
                to="/invoices"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No invoices created yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.contact?.name || 'Unknown'} · Due {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-mono">{formatCurrency(inv.total)}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding bills */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Outstanding Bills
              </CardTitle>
              <Link
                to="/bills"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentBills.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No bills created yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{bill.billNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {bill.contact?.name || 'Unknown'} · Due {formatDate(bill.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-mono">{formatCurrency(bill.total)}</span>
                        <StatusBadge status={bill.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Account type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accounts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(accountsByType).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No accounts configured yet.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(accountsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {type.toLowerCase().replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{
                              width: `${Math.min(100, (count / accounts.length) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial periods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Financial Periods
            </CardTitle>
            <Link
              to="/periods"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No periods configured yet.
              </p>
            ) : (
              <div className="space-y-3">
                {periods.slice(0, 6).map((period) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm">{period.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(period.startDate)} – {formatDate(period.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={period.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
