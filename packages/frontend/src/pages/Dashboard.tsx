import { useEffect, useState } from 'react'
import {
  BookOpen,
  FileText,
  FilePenLine,
  FileCheck,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { api, type Journal, type Account, type FinancialPeriod } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
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
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        const [accountsRes, journalsRes, periodsRes] = await Promise.allSettled([
          api.get<Account[]>('/accounts'),
          api.get<Journal[]>('/journals'),
          api.get<FinancialPeriod[]>('/periods'),
        ])

        if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value)
        if (journalsRes.status === 'fulfilled') setJournals(journalsRes.value)
        if (periodsRes.status === 'fulfilled') setPeriods(periodsRes.value)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const draftCount = journals.filter((j) => j.status === 'DRAFT').length
  const postedCount = journals.filter((j) => j.status === 'POSTED').length
  const currentPeriod = periods.find((p) => p.status === 'OPEN')

  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

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

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={accounts.length}
          subtitle={`${Object.keys(accountsByType).length} account types`}
          icon={BookOpen}
        />
        <StatCard
          title="Total Journals"
          value={journals.length}
          subtitle={`${postedCount} posted`}
          icon={FileText}
        />
        <StatCard
          title="Draft Journals"
          value={draftCount}
          subtitle="Awaiting posting"
          icon={FilePenLine}
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
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent journals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Journal Entries</CardTitle>
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

        {/* Account breakdown + Period status */}
        <div className="space-y-6">
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
                        <span className="text-sm font-mono text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial periods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Financial Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No periods configured yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {periods.slice(0, 5).map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{period.name}</span>
                      <StatusBadge status={period.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
