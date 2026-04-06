import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Send,
  RotateCcw,
  Eye,
  ArrowUpDown,
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
import { api, type Journal, type Account } from '../lib/api'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import CreateJournalModal from '../components/journals/CreateJournalModal'
import JournalDetailModal from '../components/journals/JournalDetailModal'
import PostJournalModal from '../components/journals/PostJournalModal'
import ReverseJournalModal from '../components/journals/ReverseJournalModal'

type StatusFilter = 'ALL' | 'DRAFT' | 'POSTED' | 'REVERSED' | 'AMENDED'
type SortField = 'journalNumber' | 'date' | 'description' | 'totalDebitAmount' | 'status'
type SortDir = 'asc' | 'desc'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'POSTED':
      return <Badge variant="success">{status}</Badge>
    case 'DRAFT':
      return <Badge variant="warning">{status}</Badge>
    case 'REVERSED':
    case 'AMENDED':
      return <Badge variant="error">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function JournalTypeBadge({ type }: { type: string }) {
  const label = type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-secondary/50 text-muted-foreground border-border">
      {label}
    </span>
  )
}

export default function JournalEntries() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingJournal, setViewingJournal] = useState<Journal | null>(null)
  const [postingJournal, setPostingJournal] = useState<Journal | null>(null)
  const [reversingJournal, setReversingJournal] = useState<Journal | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [journalsData, accountsData] = await Promise.all([
        api.get<Journal[]>('/journals'),
        api.get<Account[]>('/accounts'),
      ])
      setJournals(journalsData)
      setAccounts(accountsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick() {
      setShowStatusDropdown(false)
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'date' ? 'desc' : 'asc')
    }
  }

  const handleJournalCreated = () => {
    setShowCreateModal(false)
    loadData()
  }

  const handleJournalPosted = () => {
    setPostingJournal(null)
    loadData()
  }

  const handleJournalReversed = () => {
    setReversingJournal(null)
    loadData()
  }

  const accountMap = useMemo(() => {
    const map: Record<string, Account> = {}
    accounts.forEach(a => { map[a.id] = a })
    return map
  }, [accounts])

  const filtered = useMemo(() => {
    let result = [...journals]

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(j => j.status === statusFilter)
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(j =>
        j.journalNumber.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.reference && j.reference.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'journalNumber':
          cmp = a.journalNumber.localeCompare(b.journalNumber)
          break
        case 'date':
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'description':
          cmp = a.description.localeCompare(b.description)
          break
        case 'totalDebitAmount':
          cmp = a.totalDebitAmount - b.totalDebitAmount
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [journals, statusFilter, search, sortField, sortDir])

  // Stats
  const draftCount = journals.filter(j => j.status === 'DRAFT').length
  const postedCount = journals.filter(j => j.status === 'POSTED').length
  const totalDebit = journals
    .filter(j => j.status === 'POSTED')
    .reduce((sum, j) => sum + j.totalDebitAmount, 0)

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <TableHead
        className="cursor-pointer select-none hover:text-foreground"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          <ArrowUpDown className={cn(
            'h-3 w-3',
            sortField === field ? 'text-foreground' : 'text-muted-foreground/40'
          )} />
        </div>
      </TableHead>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading journals...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground mt-1">
            Double-entry journal management and posting
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Journal
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-status-amber bg-status-amber/5">
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-sm text-status-amber">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Draft</div>
            <div className="text-2xl font-bold text-amber-400">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Posted</div>
            <div className="text-2xl font-bold text-green-400">{postedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground">Posted Total</div>
            <div className="text-2xl font-bold">{formatCurrency(totalDebit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className="gap-2"
            onClick={e => {
              e.stopPropagation()
              setShowStatusDropdown(!showStatusDropdown)
            }}
          >
            <Filter className="h-4 w-4" />
            {statusFilter === 'ALL' ? 'All Status' : statusFilter}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showStatusDropdown && (
            <div className="absolute top-full mt-1 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
              {(['ALL', 'DRAFT', 'POSTED', 'REVERSED', 'AMENDED'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                    statusFilter === s && 'bg-accent font-medium'
                  )}
                  onClick={() => {
                    setStatusFilter(s)
                    setShowStatusDropdown(false)
                  }}
                >
                  {s === 'ALL' ? 'All Status' : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Journals table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">
              {journals.length === 0 ? 'No journal entries yet' : 'No matching journals'}
            </h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              {journals.length === 0
                ? 'Create your first journal entry to start recording transactions.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {journals.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Journal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader field="journalNumber">Number</SortHeader>
                  <SortHeader field="date">Date</SortHeader>
                  <SortHeader field="description">Description</SortHeader>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <SortHeader field="totalDebitAmount">Amount</SortHeader>
                  <SortHeader field="status">Status</SortHeader>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(journal => (
                  <TableRow
                    key={journal.id}
                    className={cn(
                      'cursor-pointer hover:bg-accent/50',
                      journal.status === 'AMENDED' && 'opacity-60',
                      journal.status === 'REVERSED' && 'opacity-60'
                    )}
                    onClick={() => setViewingJournal(journal)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {journal.journalNumber}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(journal.date)}</TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">
                      {journal.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {journal.reference || '—'}
                    </TableCell>
                    <TableCell>
                      <JournalTypeBadge type={journal.type} />
                    </TableCell>
                    <TableCell className="text-sm font-mono text-right">
                      {formatCurrency(journal.totalDebitAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={journal.status} />
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <button
                          className="p-1 rounded hover:bg-accent transition-colors"
                          onClick={e => {
                            e.stopPropagation()
                            setActionMenuId(actionMenuId === journal.id ? null : journal.id)
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {actionMenuId === journal.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                              onClick={e => {
                                e.stopPropagation()
                                setActionMenuId(null)
                                setViewingJournal(journal)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </button>
                            {journal.status === 'DRAFT' && (
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 text-green-400"
                                onClick={e => {
                                  e.stopPropagation()
                                  setActionMenuId(null)
                                  setPostingJournal(journal)
                                }}
                              >
                                <Send className="h-3.5 w-3.5" />
                                Post to Ledger
                              </button>
                            )}
                            {journal.status === 'POSTED' && !journal.isAmended && (
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2 text-red-400"
                                onClick={e => {
                                  e.stopPropagation()
                                  setActionMenuId(null)
                                  setReversingJournal(journal)
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reverse
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateJournalModal
          accounts={accounts}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleJournalCreated}
        />
      )}
      {viewingJournal && (
        <JournalDetailModal
          journal={viewingJournal}
          accountMap={accountMap}
          onClose={() => setViewingJournal(null)}
          onPost={() => {
            setViewingJournal(null)
            setPostingJournal(viewingJournal)
          }}
          onReverse={() => {
            setViewingJournal(null)
            setReversingJournal(viewingJournal)
          }}
        />
      )}
      {postingJournal && (
        <PostJournalModal
          journal={postingJournal}
          onClose={() => setPostingJournal(null)}
          onPosted={handleJournalPosted}
        />
      )}
      {reversingJournal && (
        <ReverseJournalModal
          journal={reversingJournal}
          onClose={() => setReversingJournal(null)}
          onReversed={handleJournalReversed}
        />
      )}
    </div>
  )
}
