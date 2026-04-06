import { useState } from 'react'
import { X, Send, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type Journal } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface PostJournalModalProps {
  journal: Journal
  onClose: () => void
  onPosted: () => void
}

export default function PostJournalModal({ journal, onClose, onPosted }: PostJournalModalProps) {
  const [postingDate, setPostingDate] = useState(journal.date)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePost = async () => {
    try {
      setPosting(true)
      setError(null)
      await api.post(`/journals/${journal.id}/post`, {
        postingDate: postingDate || undefined,
      })
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post journal')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Post Journal</h2>
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

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            Posting a journal commits it to the general ledger. This action cannot be undone — posted journals can only be reversed or amended.
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Posting Date</label>
            <Input
              type="date"
              value={postingDate}
              onChange={e => setPostingDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Defaults to the journal date. Override if posting to a different period.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handlePost}
            disabled={posting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            {posting ? 'Posting...' : 'Confirm Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}
