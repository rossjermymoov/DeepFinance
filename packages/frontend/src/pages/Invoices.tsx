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
import { api, type Invoice } from '../lib/api'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import CreateInvoiceModal from '../components/invoices/CreateInvoiceModal'

type StatusFilter = 'ALL' | 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="warning">{status}</Badge>
    case 'SENT':
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

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<Invoice[]>('/invoices')
      setInvoices(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false)
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter
      const matchesSearch =
        search.toLowerCase() === '' ||
        invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        invoice.contact?.name.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [invoices, statusFilter, search])

  const summaryStats = useMemo(() => {
    const outstanding = invoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'VOID')
      .reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)

    const overdue = invoices.filter((inv) => inv.status === 'OVERDUE').length
    const draft = invoices.filter((inv) => inv.status === 'DRAFT').length

    return { outstanding, overdue, draft }
  }, [invoices])

  const handleApproveInvoice = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/approve`, {})
      await loadInvoices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve invoice')
    }
    setActionMenuId(null)
  }

  const handleRecordPayment = async (id: string) => {
    // In a real app, this would open a payment modal
    try {
      await api.post(`/invoices/${id}/record-payment`, {})
      await loadInvoices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    }
    setActionMenuId(null)
  }

  const handleVoidInvoice = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/void`, {})
      await loadInvoices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void invoice')
    }
    setActionMenuId(null)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingInvoice(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-2">Manage customer invoices</p>
        </div>
        <Button
          onClick={() => {
            setEditingInvoice(null)
            setShowCreateModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
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
            <p className="text-xs text-muted-foreground mt-1">Invoices overdue</p>
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
            <p className="text-xs text-muted-foreground mt-1">Unsent invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or customer..."
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
              {(['ALL', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'] as const).map(
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {invoices.length === 0 ? 'No invoices found.' : 'No invoices match your filters.'}
              </p>
              {invoices.length === 0 && (
                <p className="text-sm mt-2">Create your first invoice to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-semibold">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.contact?.name || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.amountPaid)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === invoice.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? invoice.id : null)
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
                            {invoice.status === 'DRAFT' && (
                              <DropdownMenuItem
                                onClick={() => handleApproveInvoice(invoice.id)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'SENT' ||
                              invoice.status === 'PARTIALLY_PAID') && (
                              <DropdownMenuItem
                                onClick={() => handleRecordPayment(invoice.id)}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
                              <DropdownMenuItem
                                onClick={() => handleVoidInvoice(invoice.id)}
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

      <CreateInvoiceModal
        open={showCreateModal}
        onOpenChange={handleCloseModal}
        onSuccess={() => {
          loadInvoices()
          handleCloseModal()
        }}
        editingInvoice={editingInvoice}
      />
    </div>
  )
}
