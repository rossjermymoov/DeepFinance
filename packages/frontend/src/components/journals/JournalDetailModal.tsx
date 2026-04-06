import { X, Send, RotateCcw } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import type { Journal, Account } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/utils'

interface JournalDetailModalProps {
  journal: Journal
  accountMap: Record<string, Account>
  onClose: () => void
  onPost: () => void
  onReverse: () => void
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
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function JournalDetailModal({
  journal,
  accountMap,
  onClose,
  onPost,
  onReverse,
}: JournalDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold font-mono">{journal.journalNumber}</h2>
            <StatusBadge status={journal.status} />
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Journal header info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase">Date</span>
              <p className="text-sm font-medium mt-0.5">{formatDate(journal.date)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Type</span>
              <p className="text-sm font-medium mt-0.5 capitalize">
                {journal.type.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Currency</span>
              <p className="text-sm font-medium mt-0.5">{journal.currency}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Reference</span>
              <p className="text-sm font-medium mt-0.5">{journal.reference || '—'}</p>
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground uppercase">Description</span>
            <p className="text-sm mt-0.5">{journal.description}</p>
          </div>

          {/* Amendment info */}
          {journal.amendmentReason && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
              <span className="font-medium text-red-400">Amendment reason:</span>{' '}
              <span className="text-red-300">{journal.amendmentReason}</span>
            </div>
          )}

          {/* Journal lines */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Journal Lines</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journal.lines.map((line, idx) => {
                    const account = accountMap[line.accountId]
                    return (
                      <TableRow key={line.id || idx}>
                        <TableCell className="text-sm">
                          {account ? (
                            <span>
                              <span className="font-mono text-muted-foreground">{account.code}</span>
                              {' — '}
                              {account.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Unknown account</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {line.description || '—'}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-right">
                          {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : ''}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-right">
                          {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : ''}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Totals */}
                  <TableRow className="border-t-2 border-border font-semibold">
                    <TableCell colSpan={2} className="text-sm">Total</TableCell>
                    <TableCell className="text-sm font-mono text-right">
                      {formatCurrency(journal.totalDebitAmount)}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-right">
                      {formatCurrency(journal.totalCreditAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDate(journal.createdAt)}</p>
            {journal.amendsJournalId && <p>Amends journal: {journal.amendsJournalId}</p>}
            {journal.amendedByJournalId && <p>Amended by journal: {journal.amendedByJournalId}</p>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {journal.status === 'DRAFT' && (
            <Button onClick={onPost} className="gap-2 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" />
              Post to Ledger
            </Button>
          )}
          {journal.status === 'POSTED' && !journal.isAmended && (
            <Button onClick={onReverse} variant="destructive" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reverse
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
