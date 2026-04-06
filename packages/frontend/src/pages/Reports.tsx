import { useEffect, useState, useCallback } from 'react'
import {
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { api, type TrialBalanceRow } from '../lib/api'
import { cn, formatCurrency, formatDate } from '../lib/utils'

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LIABILITY: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  EQUITY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REVENUE: 'bg-green-500/10 text-green-400 border-green-500/20',
  EXPENSE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CONTRA: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

function AccountTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        ACCOUNT_TYPE_COLORS[type] || 'bg-secondary text-secondary-foreground'
      )}
    >
      {type}
    </span>
  )
}

interface ReportData {
  asAtDate: string
  rows: TrialBalanceRow[]
  totalDebits: number
  totalCredits: number
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asAtDate, setAsAtDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ asAtDate })
      const response = await api.get<ReportData>(
        `/journals/reports/trial-balance?${params}`
      )
      setData(response)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [asAtDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReport()
    }, 500)
    return () => clearTimeout(timer)
  }, [asAtDate, loadReport])

  const isBalanced = data && Math.abs(data.totalDebits - data.totalCredits) < 1

  // Group rows by account type
  const groupedRows = data?.rows.reduce(
    (acc, row) => {
      if (!acc[row.accountType]) {
        acc[row.accountType] = []
      }
      acc[row.accountType].push(row)
      return acc
    },
    {} as Record<string, TrialBalanceRow[]>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">Financial analysis and reporting</p>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium mb-2">As at Date</label>
              <Input
                type="date"
                value={asAtDate}
                onChange={(e) => setAsAtDate(e.target.value)}
                className="bg-card"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {data && formatDate(data.asAtDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Debits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totalDebits)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totalCredits)}
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'border-border/50',
              isBalanced ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Difference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  isBalanced ? 'text-green-400' : 'text-red-400'
                )}
              >
                {formatCurrency(Math.abs(data.totalDebits - data.totalCredits))}
              </div>
              {!isBalanced && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Trial balance does not balance
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trial Balance Table */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Loading trial balance...
            </div>
          </CardContent>
        </Card>
      ) : data && data.rows.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedRows || {}).map(([accountType, rows]) => [
                    <TableRow key={`header-${accountType}`} className="bg-card/50">
                      <TableCell colSpan={6} className="py-2">
                        <AccountTypeBadge type={accountType} />
                      </TableCell>
                    </TableRow>,
                    ...rows.map((row) => (
                      <TableRow key={row.accountId}>
                        <TableCell className="font-mono text-sm">
                          {row.accountCode}
                        </TableCell>
                        <TableCell>{row.accountName}</TableCell>
                        <TableCell>
                          <AccountTypeBadge type={row.accountType} />
                        </TableCell>
                        <TableCell className="text-right">
                          {row.totalDebit > 0 ? formatCurrency(row.totalDebit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.totalCredit > 0 ? formatCurrency(row.totalCredit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.balance)}
                        </TableCell>
                      </TableRow>
                    )),
                  ])}
                  <TableRow className="border-t-2 border-border font-semibold bg-card/50">
                    <TableCell colSpan={3}>Totals</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(data.totalDebits)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(data.totalCredits)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(data.totalDebits - data.totalCredits)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No trial balance data available for this date.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
