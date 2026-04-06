import { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  ChevronDown,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
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
import { api, type Account } from '../lib/api'
import { cn } from '../lib/utils'

type SortField = 'code' | 'name' | 'type' | 'normalBalance'
type SortDir = 'asc' | 'desc'
type AccountTypeFilter = string | 'ALL'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
  CONTRA: 'Contra',
}

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
      {ACCOUNT_TYPE_LABELS[type] || type}
    </span>
  )
}

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>('ALL')
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showInactive, setShowInactive] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true)
        const data = await api.get<Account[]>('/accounts')
        setAccounts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts')
      } finally {
        setLoading(false)
      }
    }
    loadAccounts()
  }, [])

  const accountTypes = useMemo(
    () => [...new Set(accounts.map((a) => a.type))].sort(),
    [accounts]
  )

  const filteredAccounts = useMemo(() => {
    let result = accounts

    // Active filter
    if (!showInactive) {
      result = result.filter((a) => a.isActive)
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((a) => a.type === typeFilter)
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] ?? ''
      const bVal = b[sortField] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [accounts, search, typeFilter, sortField, sortDir, showInactive])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortableHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <TableHead
        className="cursor-pointer select-none hover:text-foreground transition-colors"
        onClick={() => toggleSort(field)}
      >
        <div className="flex items-center gap-1.5">
          {children}
          <ArrowUpDown
            className={cn(
              'h-3.5 w-3.5',
              sortField === field ? 'text-primary' : 'text-muted-foreground/40'
            )}
          />
        </div>
      </TableHead>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading accounts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organisation's account structure
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-status-red bg-status-red/5">
          <CardContent className="py-3">
            <p className="text-sm text-status-red">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(ACCOUNT_TYPE_LABELS).map(([type, label]) => {
          const count = accounts.filter((a) => a.type === type && a.isActive).length
          return (
            <Card
              key={type}
              className={cn(
                'cursor-pointer transition-colors',
                typeFilter === type
                  ? 'ring-1 ring-primary border-primary'
                  : 'hover:border-muted-foreground/30'
              )}
              onClick={() => setTypeFilter(typeFilter === type ? 'ALL' : type)}
            >
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold mt-0.5">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {typeFilter === 'ALL' ? 'All Types' : ACCOUNT_TYPE_LABELS[typeFilter] || typeFilter}
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
          {showFilterDropdown && (
            <div className="absolute top-full mt-1 z-10 w-44 bg-card border border-border rounded-md shadow-lg py-1">
              <button
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm hover:bg-secondary transition-colors',
                  typeFilter === 'ALL' && 'text-primary'
                )}
                onClick={() => {
                  setTypeFilter('ALL')
                  setShowFilterDropdown(false)
                }}
              >
                All Types
              </button>
              {accountTypes.map((type) => (
                <button
                  key={type}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm hover:bg-secondary transition-colors',
                    typeFilter === type && 'text-primary'
                  )}
                  onClick={() => {
                    setTypeFilter(type)
                    setShowFilterDropdown(false)
                  }}
                >
                  {ACCOUNT_TYPE_LABELS[type] || type}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant={showInactive ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? 'Showing inactive' : 'Show inactive'}
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredAccounts.length} of {accounts.length} accounts
        </span>
      </div>

      {/* Accounts table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="code">Code</SortableHeader>
                <SortableHeader field="name">Account Name</SortableHeader>
                <SortableHeader field="type">Type</SortableHeader>
                <SortableHeader field="normalBalance">Normal Balance</SortableHeader>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {accounts.length === 0
                      ? 'No accounts yet. Add your first account to get started.'
                      : 'No accounts match your filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className={cn(
                      'cursor-pointer hover:bg-secondary/50 transition-colors',
                      !account.isActive && 'opacity-50'
                    )}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {account.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        {account.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                            {account.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccountTypeBadge type={account.type} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          account.normalBalance === 'DEBIT'
                            ? 'text-blue-400'
                            : 'text-purple-400'
                        )}
                      >
                        {account.normalBalance}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.currency}
                    </TableCell>
                    <TableCell>
                      {account.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="error">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
