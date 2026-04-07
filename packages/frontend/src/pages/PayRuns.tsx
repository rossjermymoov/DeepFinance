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
import { api, type PayRun } from '../lib/api'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import CreatePayRunModal from '../components/payroll/CreatePayRunModal'
import PayslipListModal from '../components/payroll/PayslipListModal'
import SubmitPayRunModal from '../components/payroll/SubmitPayRunModal'

type StatusFilter = 'ALL' | 'DRAFT' | 'CALCULATED' | 'REVIEWED' | 'SUBMITTED' | 'COMPLETED'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary">{status}</Badge>
    case 'CALCULATED':
      return <Badge variant="warning">{status}</Badge>
    case 'REVIEWED':
      return <Badge variant="secondary">{status}</Badge>
    case 'SUBMITTED':
      return <Badge variant="warning">{status}</Badge>
    case 'COMPLETED':
      return <Badge variant="success">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function PayRuns() {
  const [payRuns, setPayRuns] = useState<PayRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPayRun, setSelectedPayRun] = useState<PayRun | null>(null)
  const [showPayslipModal, setShowPayslipModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<PayRun[]>('/payroll/pay-runs').catch(() => [])
      setPayRuns(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pay runs')
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
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredPayRuns = useMemo(() => {
    return payRuns.filter((run) => {
      const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter
      return matchesStatus
    })
  }, [payRuns, statusFilter])

  const currentPayRun = useMemo(() => {
    return payRuns.find(run => run.status === 'CALCULATED' || run.status === 'DRAFT')
  }, [payRuns])

  const summaryStats = useMemo(() => {
    const current = currentPayRun
    return {
      thisPeriodGross: current?.totalGrossPay || 0,
      thisPeriodTax: current?.totalTaxDeducted || 0,
      thisPeriodNi: (current?.totalNiEmployee || 0) + (current?.totalNiEmployer || 0),
      thisPeriodNet: current?.totalNetPay || 0,
    }
  }, [currentPayRun])

  const handleRecalculate = async (id: string) => {
    try {
      setSubmittingId(id)
      await api.post(`/payroll/pay-runs/${id}/calculate`, {})
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate pay run')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleReview = async (id: string) => {
    try {
      setSubmittingId(id)
      await api.patch(`/payroll/pay-runs/${id}`, { status: 'REVIEWED' })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as reviewed')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleSubmitClick = (id: string) => {
    const run = payRuns.find(r => r.id === id)
    if (run) {
      setSelectedPayRun(run)
      setShowPayslipModal(false)
      setShowSubmitModal(true)
    }
  }

  const handleViewPayslips = (id: string) => {
    const run = payRuns.find(r => r.id === id)
    if (run) {
      setSelectedPayRun(run)
      setShowPayslipModal(true)
    }
    setActionMenuId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pay Runs</h1>
          <p className="text-muted-foreground mt-2">Calculate and manage payroll runs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Pay Run
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

      {/* Status Banner */}
      {currentPayRun && (
        <Card className={
          currentPayRun.status === 'DRAFT'
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-blue-500/30 bg-blue-500/5'
        }>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {currentPayRun.status === 'DRAFT' ? (
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              ) : (
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">
                  Pay Run {currentPayRun.payRunNumber} - {currentPayRun.status}
                </p>
                <p className="text-sm text-muted-foreground">
                  Period: {formatDate(currentPayRun.periodStart)} to {formatDate(currentPayRun.periodEnd)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Period Gross
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.thisPeriodGross)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total payroll cost</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tax Deducted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(summaryStats.thisPeriodTax)}</div>
            <p className="text-xs text-muted-foreground mt-1">PAYE deductions</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NI Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(summaryStats.thisPeriodNi)}</div>
            <p className="text-xs text-muted-foreground mt-1">Employee & employer</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(summaryStats.thisPeriodNet)}</div>
            <p className="text-xs text-muted-foreground mt-1">To employees</p>
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
              {(['ALL', 'DRAFT', 'CALCULATED', 'REVIEWED', 'SUBMITTED', 'COMPLETED'] as const).map(
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
      </div>

      {/* Pay Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading pay runs...
            </div>
          ) : filteredPayRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {payRuns.length === 0 ? 'No pay runs found.' : 'No pay runs match your filters.'}
              </p>
              {payRuns.length === 0 && (
                <p className="text-sm mt-2">Create your first pay run to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pay Run #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Tax Period</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-sm">{run.payRunNumber}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {run.taxYear.split('-')[0]}-{run.taxPeriod}
                      </TableCell>
                      <TableCell className="text-sm">{run.payFrequency}</TableCell>
                      <TableCell className="text-right font-medium">{run.employeeCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(run.totalGrossPay)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">
                        {formatCurrency(run.totalNetPay)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === run.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? run.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-secondary rounded-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(run.status === 'CALCULATED' || run.status === 'REVIEWED' || run.status === 'SUBMITTED' || run.status === 'COMPLETED') && (
                              <DropdownMenuItem
                                onClick={() => handleViewPayslips(run.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Payslips
                              </DropdownMenuItem>
                            )}
                            {(run.status === 'DRAFT' || run.status === 'CALCULATED') && (
                              <DropdownMenuItem
                                onClick={() => submittingId !== run.id && handleRecalculate(run.id)}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Calculate
                              </DropdownMenuItem>
                            )}
                            {run.status === 'CALCULATED' && (
                              <DropdownMenuItem
                                onClick={() => submittingId !== run.id && handleReview(run.id)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Reviewed
                              </DropdownMenuItem>
                            )}
                            {run.status === 'REVIEWED' && (
                              <DropdownMenuItem
                                onClick={() => handleSubmitClick(run.id)}
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

      {/* Modals */}
      <CreatePayRunModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadData}
      />

      <PayslipListModal
        open={showPayslipModal}
        onOpenChange={setShowPayslipModal}
        payRun={selectedPayRun}
      />

      <SubmitPayRunModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        payRun={selectedPayRun}
        onSuccess={loadData}
      />
    </div>
  )
}
