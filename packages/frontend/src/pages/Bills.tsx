import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Check,
  DollarSign,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
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
import { api, type Bill } from '../lib/api'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import CreateBillModal from '../components/bills/CreateBillModal'

type StatusFilter = 'ALL' | 'DRAFT' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="warning">{status}</Badge>
    case 'APPROVED':
      return <Badge variant="secondary">{status}</Badge>
    case 'PARTIALLY_PAID':
      return <Badge variant="warning">Partially Paid</Badge>
    case 'PAID':
      return <Badge variant="success">{status}</Badge>
    case 'OVERDUE':
      return <Badge variant="error">{status}</Badge>
    case 'VOID':
      return <Badge variant="error">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const loadBills = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<Bill[]>('/bills')
      setBills(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bills')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false)
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter
      const matchesSearch =
        search.toLowerCase() === '' ||
        bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
        bill.contact?.name.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bills, statusFilter, search])

  const summaryStats = useMemo(() => {
    const outstanding = bills
      .filter((bill) => bill.status !== 'PAID' && bill.status !== 'VOID')
      .reduce((sum, bill) => sum + (bill.total - bill.amountPaid), 0)

    const overdue = bills.filter((bill) => bill.status === 'OVERDUE').length
    const draft = bills.filter((bill) => bill.status === 'DRAFT').length

    return { outstanding, overdue, draft }
  }, [bills])

  const handleApproveBill = async (id: string) => {
    try {
      await api.post(`/bills/${id}/approve`, {})
      await loadBills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve bill')
    }
    setActionMenuId(null)
  }

  const handleRecordPayment = async (id: string) => {
    try {
      await api.post(`/bills/${id}/record-payment`, {})
      await loadBills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    }
    setActionMenuId(null)
  }

  const handleVoidBill = async (id: string) => {
    try {
      await api.post(`/bills/${id}/void`, {})
      await loadBills()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void bill')
    }
    setActionMenuId(null)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingBill(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground mt-2">Manage supplier bills</p>
        </div>
        <Button
          onClick={() => {
            setEditingBill(null)
            setShowCreateModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Bill
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.outstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">Unpaid or partially paid</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{summaryStats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">Bills overdue</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{summaryStats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">Unapproved bills</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by bill number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="px-4 py-2 rounded-md border border-border hover:bg-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'ALL' ? 'All Status' : statusFilter}
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
              {(['ALL', 'DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'] as const).map(
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

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading bills...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{bills.length === 0 ? 'No bills found.' : 'No bills match your filters.'}</p>
              {bills.length === 0 && (
                <p className="text-sm mt-2">Create your first bill to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono font-semibold">
                        {bill.billNumber}
                      </TableCell>
                      <TableCell>{bill.contact?.name || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(bill.issueDate)}</TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(bill.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bill.amountPaid)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bill.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === bill.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? bill.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-secondary rounded-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {bill.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleApproveBill(bill.id)}>
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {(bill.status === 'APPROVED' ||
                              bill.status === 'PARTIALLY_PAID') && (
                              <DropdownMenuItem
                                onClick={() => handleRecordPayment(bill.id)}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {bill.status !== 'VOID' && bill.status !== 'PAID' && (
                              <DropdownMenuItem
                                onClick={() => handleVoidBill(bill.id)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Void
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

      <CreateBillModal
        open={showCreateModal}
        onOpenChange={handleCloseModal}
        onSuccess={() => {
          loadBills()
          handleCloseModal()
        }}
        editingBill={editingBill}
      />
    </div>
  )
}
