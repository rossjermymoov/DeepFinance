import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, MoreHorizontal, Upload, X } from 'lucide-react'
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
import { api, type Account, type BankTransaction, type ReconciliationSummary } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import AddTransactionModal from '../components/bank/AddTransactionModal'

type StatusFilter = 'ALL' | 'UNRECONCILED' | 'MATCHED' | 'RECONCILED' | 'EXCLUDED'

function StatusBadge({
  status,
}: {
  status: BankTransaction['reconciliationStatus']
}) {
  switch (status) {
    case 'UNRECONCILED':
      return <Badge variant="warning">Unreconciled</Badge>
    case 'MATCHED':
      return <Badge variant="secondary">Matched</Badge>
    case 'RECONCILED':
      return <Badge variant="success">Reconciled</Badge>
    case 'EXCLUDED':
      return <Badge variant="error">Excluded</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function BankReconciliation() {
  const [bankAccounts, setBankAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  // Load bank accounts
  const loadBankAccounts = useCallback(async () => {
    try {
      const data = await api.get<Account[]>('/accounts')
      const bankAcctAccounts = data.filter(
        (acc) => acc.type === 'ASSET' && acc.subType === 'BANK_ACCOUNT'
      )
      setBankAccounts(bankAcctAccounts)
      if (bankAcctAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(bankAcctAccounts[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bank accounts')
    }
  }, [selectedAccountId])

  // Load transactions for selected account
  const loadTransactions = useCallback(async () => {
    if (!selectedAccountId) return

    try {
      setLoading(true)
      const [txns, summ] = await Promise.all([
        api.get<BankTransaction[]>(`/bank-transactions?bankAccountId=${selectedAccountId}`),
        api.get<ReconciliationSummary>(
          `/bank-transactions/summary?bankAccountId=${selectedAccountId}`
        ),
      ])
      setTransactions(txns)
      setSummary(summ)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId])

  useEffect(() => {
    loadBankAccounts()
  }, [loadBankAccounts])

  useEffect(() => {
    if (selectedAccountId) {
      loadTransactions()
    }
  }, [selectedAccountId, loadTransactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (statusFilter === 'ALL') return true
      return txn.reconciliationStatus === statusFilter
    })
  }, [transactions, statusFilter])

  const handleReconcile = async (id: string) => {
    try {
      await api.patch(`/bank-transactions/${id}`, {
        reconciliationStatus: 'RECONCILED',
      })
      await loadTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconcile transaction')
    }
    setActionMenuId(null)
  }

  const handleExclude = async (id: string) => {
    try {
      await api.patch(`/bank-transactions/${id}`, {
        reconciliationStatus: 'EXCLUDED',
      })
      await loadTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to exclude transaction')
    }
    setActionMenuId(null)
  }

  const handleUnreconcile = async (id: string) => {
    try {
      await api.patch(`/bank-transactions/${id}`, {
        reconciliationStatus: 'UNRECONCILED',
      })
      await loadTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unreconcile transaction')
    }
    setActionMenuId(null)
  }

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActionMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
          <p className="text-muted-foreground mt-2">
            Reconcile bank transactions with journal entries
          </p>
        </div>
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

      {/* Account Selector */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bank Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedAccountId && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-sm font-medium">Total</div>
              <div className="text-2xl font-bold mt-2">{summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-amber-400 text-sm font-medium">Unreconciled</div>
              <div className="text-2xl font-bold mt-2">{summary.unreconciled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-emerald-400 text-sm font-medium">Reconciled</div>
              <div className="text-2xl font-bold mt-2">{summary.reconciled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-purple-400 text-sm font-medium">Matched</div>
              <div className="text-2xl font-bold mt-2">{summary.matched}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-sm font-medium">
                Unreconciled Amount
              </div>
              <div className="text-2xl font-bold mt-2 text-amber-400">
                {formatCurrency(summary.unreconciledAmount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Transactions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled title="CSV import coming soon">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              disabled={!selectedAccountId}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAccountId ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a bank account to view transactions.
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {transactions.length === 0
                  ? 'No transactions found for this account.'
                  : 'No transactions match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNRECONCILED">Unreconciled</option>
                  <option value="MATCHED">Matched</option>
                  <option value="RECONCILED">Reconciled</option>
                  <option value="EXCLUDED">Excluded</option>
                </select>
              </div>

              {/* Transactions List */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(txn.transactionDate)}
                        </TableCell>
                        <TableCell className="font-medium">{txn.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {txn.reference || '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              txn.type === 'CREDIT'
                                ? 'text-emerald-400 font-medium'
                                : 'text-red-400 font-medium'
                            )}
                          >
                            {txn.type === 'CREDIT' ? '+' : '-'}
                            {formatCurrency(txn.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {txn.balance !== null ? formatCurrency(txn.balance) : '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={txn.reconciliationStatus} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu
                            open={actionMenuId === txn.id}
                            onOpenChange={(open) =>
                              setActionMenuId(open ? txn.id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-secondary rounded-md">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {txn.reconciliationStatus !== 'RECONCILED' && (
                                <DropdownMenuItem
                                  onClick={() => handleReconcile(txn.id)}
                                >
                                  Reconcile
                                </DropdownMenuItem>
                              )}
                              {txn.reconciliationStatus !== 'EXCLUDED' && (
                                <DropdownMenuItem
                                  onClick={() => handleExclude(txn.id)}
                                >
                                  Exclude
                                </DropdownMenuItem>
                              )}
                              {txn.reconciliationStatus !== 'UNRECONCILED' && (
                                <DropdownMenuItem
                                  onClick={() => handleUnreconcile(txn.id)}
                                >
                                  Mark Unreconciled
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
            </div>
          )}
        </CardContent>
      </Card>

      <AddTransactionModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          loadTransactions()
          setShowAddModal(false)
        }}
        bankAccountId={selectedAccountId}
      />
    </div>
  )
}
