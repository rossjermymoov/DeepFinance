import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  ChevronDown,
  BookOpen,
  FileSpreadsheet,
  Pencil,
  Lock,
  Unlock,
  Archive,
  ArchiveRestore,
  List,
  FolderTree,
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
import CreateAccountModal from '../components/accounts/CreateAccountModal'
import SeedTemplateModal from '../components/accounts/SeedTemplateModal'

type SortField = 'code' | 'name' | 'type' | 'normalBalance'
type SortDir = 'asc' | 'desc'
type AccountTypeFilter = string | 'ALL'
type ViewMode = 'flat' | 'grouped'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [showSeedModal, setShowSeedModal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<Account[]>('/accounts')
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  function handleAccountCreated(_account: Account) {
    setShowCreateModal(false)
    setEditingAccount(null)
    loadAccounts()
  }

  async function handleToggleActive(account: Account) {
    try {
      await api.patch(`/accounts/${account.id}`, { isActive: !account.isActive })
      loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account')
    }
    setActionMenuId(null)
  }

  async function handleToggleLock(account: Account) {
    try {
      await api.patch(`/accounts/${account.id}`, { isLocked: !account.isLocked })
      loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account')
    }
    setActionMenuId(null)
  }

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

  // Grouped view: accounts grouped by type, children indented under parents
  const groupedAccounts = useMemo(() => {
    if (viewMode !== 'grouped') return null

    const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']
    const groups: { type: string; label: string; accounts: (Account & { depth: number })[] }[] = []

    for (const type of typeOrder) {
      const typeAccounts = filteredAccounts.filter((a) => a.type === type)
      if (typeAccounts.length === 0) continue

      // Build parent-child tree
      const roots = typeAccounts.filter((a) => !a.parentAccountId)
      const children = typeAccounts.filter((a) => a.parentAccountId)

      const flatList: (Account & { depth: number })[] = []
      function addWithChildren(account: Account, depth: number) {
        flatList.push({ ...account, depth })
        const kids = children.filter((c) => c.parentAccountId === account.id)
        kids.sort((a, b) => a.code.localeCompare(b.code))
        for (const kid of kids) {
          addWithChildren(kid, depth + 1)
        }
      }
      roots.sort((a, b) => a.code.localeCompare(b.code))
      for (const root of roots) {
        addWithChildren(root, 0)
      }
      // Also add orphan children (parent not in filtered set)
      const addedIds = new Set(flatList.map((a) => a.id))
      for (const child of children) {
        if (!addedIds.has(child.id)) {
          flatList.push({ ...child, depth: 1 })
        }
      }

      groups.push({
        type,
        label: ACCOUNT_TYPE_LABELS[type] || type,
        accounts: flatList,
      })
    }

    return groups
  }, [filteredAccounts, viewMode])

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
        <div className="flex items-center gap-2">
          {accounts.length === 0 && (
            <Button variant="outline" onClick={() => setShowSeedModal(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Load UK Template
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
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

        <div className="flex items-center gap-1 ml-auto mr-3 border border-border rounded-md p-0.5">
          <Button
            variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('grouped')}
          >
            <FolderTree className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('flat')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>

        <span className="text-sm text-muted-foreground">
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
                    {accounts.length === 0 ? (
                      <div className="space-y-3">
                        <p>No accounts yet. Get started by loading a UK template or adding accounts manually.</p>
                        <Button variant="outline" onClick={() => setShowSeedModal(true)}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Load UK Template
                        </Button>
                      </div>
                    ) : (
                      'No accounts match your filters.'
                    )}
                  </TableCell>
                </TableRow>
              ) : viewMode === 'grouped' && groupedAccounts ? (
                groupedAccounts.map((group) => (
                  <React.Fragment key={group.type}>
                    {/* Group header row */}
                    <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                      <TableCell colSpan={7} className="py-2">
                        <div className="flex items-center gap-2">
                          <AccountTypeBadge type={group.type} />
                          <span className="text-sm font-medium">{group.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({group.accounts.length})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.accounts.map((account) => (
                      <TableRow
                        key={account.id}
                        className={cn(
                          'cursor-pointer hover:bg-secondary/50 transition-colors',
                          !account.isActive && 'opacity-50'
                        )}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          <span style={{ paddingLeft: `${account.depth * 20}px` }}>
                            {account.depth > 0 && (
                              <span className="text-muted-foreground/40 mr-1">└</span>
                            )}
                            {account.code}
                          </span>
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
                          <span className={cn('text-xs font-medium', account.normalBalance === 'DEBIT' ? 'text-blue-400' : 'text-purple-400')}>
                            {account.normalBalance}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{account.currency}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {account.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="error">Archived</Badge>}
                            {account.isLocked && <span title="Locked"><Lock className="h-3.5 w-3.5 text-amber-400" /></span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === account.id ? null : account.id) }}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {actionMenuId === account.id && (
                              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-card border border-border rounded-md shadow-lg py-1">
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setEditingAccount(account); setActionMenuId(null) }}>
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </button>
                                {!account.isSystemAccount && (
                                  <>
                                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleToggleLock(account) }}>
                                      {account.isLocked ? <><Unlock className="h-3.5 w-3.5" /> Unlock</> : <><Lock className="h-3.5 w-3.5" /> Lock</>}
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleToggleActive(account) }}>
                                      {account.isActive ? <><Archive className="h-3.5 w-3.5 text-orange-400" /><span className="text-orange-400">Archive</span></> : <><ArchiveRestore className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400">Restore</span></>}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
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
                      <div className="flex items-center gap-1.5">
                        {account.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="error">Archived</Badge>
                        )}
                        {account.isLocked && (
                          <span title="Locked">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActionMenuId(actionMenuId === account.id ? null : account.id)
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {actionMenuId === account.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-card border border-border rounded-md shadow-lg py-1">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingAccount(account)
                                setActionMenuId(null)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            {!account.isSystemAccount && (
                              <>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleLock(account)
                                  }}
                                >
                                  {account.isLocked ? (
                                    <>
                                      <Unlock className="h-3.5 w-3.5" />
                                      Unlock
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3.5 w-3.5" />
                                      Lock
                                    </>
                                  )}
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleActive(account)
                                  }}
                                >
                                  {account.isActive ? (
                                    <>
                                      <Archive className="h-3.5 w-3.5 text-orange-400" />
                                      <span className="text-orange-400">Archive</span>
                                    </>
                                  ) : (
                                    <>
                                      <ArchiveRestore className="h-3.5 w-3.5 text-green-400" />
                                      <span className="text-green-400">Restore</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Seed template modal */}
      {showSeedModal && (
        <SeedTemplateModal
          onClose={() => setShowSeedModal(false)}
          onSeeded={() => {
            setShowSeedModal(false)
            loadAccounts()
          }}
        />
      )}

      {/* Create / Edit modal */}
      {(showCreateModal || editingAccount) && (
        <CreateAccountModal
          accounts={accounts}
          editAccount={editingAccount}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAccount(null)
          }}
          onCreated={handleAccountCreated}
        />
      )}
    </div>
  )
}
