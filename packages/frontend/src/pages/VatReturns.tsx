import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Send,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { api, type VatReturn, type VatObligation, type VatSettings } from '../lib/api'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import CalculateReturnModal from '../components/vat/CalculateReturnModal'
import VatReturnDetailModal from '../components/vat/VatReturnDetailModal'
import SubmitReturnModal from '../components/vat/SubmitReturnModal'

type StatusFilter = 'ALL' | 'DRAFT' | 'CALCULATED' | 'REVIEWED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="warning">{status}</Badge>
    case 'CALCULATED':
      return <Badge variant="warning">{status}</Badge>
    case 'REVIEWED':
      return <Badge variant="secondary">{status}</Badge>
    case 'SUBMITTED':
      return <Badge variant="warning">SUBMITTED</Badge>
    case 'ACCEPTED':
      return <Badge variant="success">{status}</Badge>
    case 'REJECTED':
      return <Badge variant="error">{status}</Badge>
    case 'AMENDED':
      return <Badge variant="warning">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function VatReturns() {
  const [vatSettings, setVatSettings] = useState<VatSettings | null>(null)
  const [vatReturns, setVatReturns] = useState<VatReturn[]>([])
  const [obligations, setObligations] = useState<VatObligation[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showCalculateModal, setShowCalculateModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<VatReturn | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [settings, returns, oblig] = await Promise.all([
        api.get<VatSettings>('/vat/settings').catch(() => null),
        api.get<VatReturn[]>('/vat/returns').catch(() => []),
        api.get<VatObligation[]>('/vat/obligations').catch(() => []),
      ])
      setVatSettings(settings)
      setVatReturns(returns || [])
      setObligations(oblig || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VAT data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false)
      setShowYearDropdown(false)
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredReturns = useMemo(() => {
    return vatReturns.filter((ret) => {
      const matchesStatus = statusFilter === 'ALL' || ret.status === statusFilter
      const returnYear = new Date(ret.periodStart).getFullYear()
      const matchesYear = returnYear === yearFilter
      return matchesStatus && matchesYear
    })
  }, [vatReturns, statusFilter, yearFilter])

  const summaryStats = useMemo(() => {
    const outstanding = vatReturns.filter(
      (ret) => ret.status === 'DRAFT' || ret.status === 'CALCULATED'
    ).length

    const submitted = vatReturns.filter(
      (ret) => ret.status === 'SUBMITTED' || ret.status === 'ACCEPTED'
    ).length

    const netPayable = vatReturns
      .filter((ret) => ret.status === 'DRAFT' || ret.status === 'CALCULATED')
      .reduce((sum, ret) => sum + ret.box5, 0)

    const openObligations = obligations.filter((o) => o.status === 'OPEN')
    const nextDue = openObligations.length > 0
      ? openObligations.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
      : null

    return { outstanding, submitted, netPayable, nextDue }
  }, [vatReturns, obligations])

  const handleSyncObligations = async () => {
    try {
      setSyncing(true)
      await api.post('/vat/obligations/sync', {})
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync obligations')
    } finally {
      setSyncing(false)
    }
  }

  const handleRecalculate = async (id: string) => {
    try {
      setSubmittingId(id)
      await api.post(`/vat/returns/${id}/recalculate`, {})
      await loadData()
      setShowDetailModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleReview = async (id: string) => {
    try {
      setSubmittingId(id)
      await api.patch(`/vat/returns/${id}`, { status: 'REVIEWED' })
      await loadData()
      setShowDetailModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as reviewed')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleSubmitClick = (id: string) => {
    const ret = vatReturns.find(r => r.id === id)
    if (ret) {
      setSelectedReturn(ret)
      setShowDetailModal(false)
      setShowSubmitModal(true)
    }
  }

  const availableYears = useMemo(() => {
    const years = new Set(vatReturns.map((ret) => new Date(ret.periodStart).getFullYear()))
    const current = new Date().getFullYear()
    years.add(current)
    years.add(current - 1)
    return Array.from(years).sort((a, b) => b - a)
  }, [vatReturns])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VAT Returns</h1>
          <p className="text-muted-foreground mt-2">Manage VAT compliance and submissions</p>
        </div>
        <Button onClick={() => setShowCalculateModal(true)} disabled={!vatSettings?.isRegistered}>
          <Plus className="w-4 h-4 mr-2" />
          Calculate Return
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6 flex items-start justify-between">
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-500/10 rounded-md ml-4"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* VAT Status Banner */}
      {vatSettings && (
        <Card className={
          vatSettings.isRegistered
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-amber-500/30 bg-amber-500/5'
        }>
          <CardContent className="pt-6">
            {!vatSettings.isRegistered ? (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">VAT not configured</p>
                  <p className="text-sm text-muted-foreground">Set up your VAT registration in Settings to calculate returns</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">VAT Number</p>
                  <p className="font-mono text-sm font-semibold mt-1">{vatSettings.vatNumber || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Scheme</p>
                  <p className="text-sm font-medium mt-1">{vatSettings.vatScheme}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Return Frequency</p>
                  <p className="text-sm font-medium mt-1">{vatSettings.returnFrequency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Synced</p>
                  <p className="text-sm font-medium mt-1">
                    {vatSettings.lastSyncedAt ? formatDate(vatSettings.lastSyncedAt) : 'Never'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Outstanding Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{summaryStats.outstanding}</div>
            <p className="text-xs text-muted-foreground mt-1">Draft or calculated</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Submitted This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{summaryStats.submitted}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted or accepted</p>
          </CardContent>
        </Card>

        <Card className={`border-border/50 ${
          summaryStats.netPayable > 0
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net VAT Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              summaryStats.netPayable > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {formatCurrency(summaryStats.netPayable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.netPayable > 0 ? 'Amount owed' : 'Refund due'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.nextDue ? formatDate(summaryStats.nextDue.dueDate) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.nextDue ? summaryStats.nextDue.periodStart.slice(0, 7) : 'No obligations'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="px-4 py-2 rounded-md border border-border hover:bg-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'ALL' ? 'All Status' : statusFilter}
          </button>
          {showStatusDropdown && (
            <div className="absolute left-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
              {(['ALL', 'DRAFT', 'CALCULATED', 'REVIEWED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'AMENDED'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setShowStatusDropdown(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors',
                      statusFilter === status && 'bg-primary/10 text-primary'
                    )}
                  >
                    {status === 'ALL' ? 'All Status' : status}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="px-4 py-2 rounded-md border border-border hover:bg-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {yearFilter}
          </button>
          {showYearDropdown && (
            <div className="absolute left-0 mt-1 w-32 bg-card border border-border rounded-md shadow-lg z-10">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setYearFilter(year)
                    setShowYearDropdown(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors',
                    yearFilter === year && 'bg-primary/10 text-primary'
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VAT Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>VAT Returns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading VAT returns...
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {vatReturns.length === 0 ? 'No VAT returns found.' : 'No returns match your filters.'}
              </p>
              {vatReturns.length === 0 && (
                <p className="text-sm mt-2">Calculate your first VAT return to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead className="text-right">Box 1 (Output)</TableHead>
                    <TableHead className="text-right">Box 4 (Input)</TableHead>
                    <TableHead className="text-right">Box 5 (Net)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-mono text-sm">
                        {ret.periodStart.slice(0, 7)} to {ret.periodEnd.slice(0, 7)}
                      </TableCell>
                      <TableCell>{formatDate(ret.dueDate)}</TableCell>
                      <TableCell className="text-sm">{ret.vatSchemeUsed}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ret.box1)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ret.box4)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={ret.box5 > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {formatCurrency(ret.box5)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ret.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === ret.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? ret.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-secondary rounded-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReturn(ret)
                                setShowDetailModal(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {(ret.status === 'DRAFT' || ret.status === 'CALCULATED') && (
                              <DropdownMenuItem
                                onClick={() => handleRecalculate(ret.id)}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Recalculate
                              </DropdownMenuItem>
                            )}
                            {ret.status === 'CALCULATED' && (
                              <DropdownMenuItem
                                onClick={() => handleReview(ret.id)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Reviewed
                              </DropdownMenuItem>
                            )}
                            {ret.status === 'REVIEWED' && (
                              <DropdownMenuItem
                                onClick={() => handleSubmitClick(ret.id)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Submit to HMRC
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Obligations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>HMRC Obligations</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncObligations}
            disabled={syncing || !vatSettings?.isRegistered}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} />
            {syncing ? 'Syncing...' : 'Sync Obligations'}
          </Button>
        </CardHeader>
        <CardContent>
          {obligations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No obligations synced yet. Click "Sync Obligations" to import from HMRC.</p>
          ) : (
            <div className="space-y-2">
              {obligations.map((oblig) => (
                <div key={oblig.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {oblig.periodStart.slice(0, 7)} to {oblig.periodEnd.slice(0, 7)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(oblig.dueDate)}
                    </p>
                  </div>
                  <Badge variant={oblig.status === 'FULFILLED' ? 'success' : 'secondary'}>
                    {oblig.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CalculateReturnModal
        open={showCalculateModal}
        onOpenChange={setShowCalculateModal}
        onSuccess={loadData}
        scheme={vatSettings?.vatScheme || 'STANDARD'}
      />

      <VatReturnDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        vatReturn={selectedReturn}
        onRecalculate={handleRecalculate}
        onReview={handleReview}
        onSubmit={handleSubmitClick}
        loading={submittingId !== null}
      />

      <SubmitReturnModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        vatReturn={selectedReturn}
        onSuccess={loadData}
      />
    </div>
  )
}
