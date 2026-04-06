import { useState } from 'react'
import { X, RotateCcw, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type Journal } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface ReverseJournalModalProps {
  journal: Journal
  onClose: () => void
  onReversed: () => void
}

export default function ReverseJournalModal({ journal, onClose, onReversed }: ReverseJournalModalProps) {
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const [reversing, setReversing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReverse = async () => {
    if (!reversalDate) return setError('Reversal date is required')

    try {
      setReversing(true)
      setError(null)
      await api.post(`/journals/${journal.id}/reverse`, {
        reversalDate,
        reason: reason.trim() || undefined,
      })
      onReversed()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reverse journal')
    } finally {
      setReversing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reverse Journal</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Journal</span>
              <span className="font-mono font-medium">{journal.journalNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium truncate ml-4">{journal.description}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-medium">{formatCurrency(journal.totalDebitAmount)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            This will create a new mirror journal with debits and credits swapped, effectively cancelling the original entry. The original journal will be marked as reversed.
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Reversal Date</label>
            <Input
              type="date"
              value={reversalDate}
              onChange={e => setReversalDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Reason (optional)</label>
            <Input
              placeholder="e.g., Duplicate entry, incorrect amount"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleReverse}
            disabled={reversing || !reversalDate}
            variant="destructive"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {reversing ? 'Reversing...' : 'Confirm Reversal'}
          </Button>
        </div>
      </div>
    </div>
  )
}
