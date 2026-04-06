import { useState } from 'react'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type Account, type Journal } from '../../lib/api'
import { cn } from '../../lib/utils'

interface CreateJournalModalProps {
  accounts: Account[]
  onClose: () => void
  onCreated: (journal: Journal) => void
}

interface JournalLineInput {
  id: string
  accountId: string
  description: string
  debit: string
  credit: string
}

function makeEmptyLine(): JournalLineInput {
  return {
    id: crypto.randomUUID(),
    accountId: '',
    description: '',
    debit: '',
    credit: '',
  }
}

export default function CreateJournalModal({ accounts, onClose, onCreated }: CreateJournalModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<JournalLineInput[]>([makeEmptyLine(), makeEmptyLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only show active, non-locked accounts
  const activeAccounts = accounts
    .filter(a => a.isActive && !a.isLocked)
    .sort((a, b) => a.code.localeCompare(b.code))

  const updateLine = (id: string, field: keyof JournalLineInput, value: string) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, [field]: value }
      // If entering debit, clear credit and vice versa
      if (field === 'debit' && value) updated.credit = ''
      if (field === 'credit' && value) updated.debit = ''
      return updated
    }))
  }

  const addLine = () => setLines(prev => [...prev, makeEmptyLine()])

  const removeLine = (id: string) => {
    if (lines.length <= 2) return
    setLines(prev => prev.filter(l => l.id !== id))
  }

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0
  const difference = totalDebit - totalCredit

  const handleSubmit = async () => {
    setError(null)

    if (!date) return setError('Date is required')
    if (!description.trim()) return setError('Description is required')

    const validLines = lines.filter(l => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
    if (validLines.length < 2) return setError('At least 2 lines with accounts and amounts are required')
    if (!isBalanced) return setError('Journal must balance — total debits must equal total credits')

    try {
      setSaving(true)
      const result = await api.post<Journal>('/journals', {
        date,
        description: description.trim(),
        reference: reference.trim() || undefined,
        lines: validLines.map(l => ({
          accountId: l.accountId,
          description: l.description.trim() || undefined,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      })
      onCreated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">New Journal Entry</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date</label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <Input
                placeholder="e.g., Office rent April 2026"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reference (optional)</label>
              <Input
                placeholder="e.g., INV-2026-001"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Journal lines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Journal Lines</h3>
              <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </Button>
            </div>

            {/* Lines table header */}
            <div className="grid grid-cols-[1fr_1fr_120px_120px_32px] gap-2 px-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">Account</span>
              <span className="text-xs font-medium text-muted-foreground uppercase">Description</span>
              <span className="text-xs font-medium text-muted-foreground uppercase text-right">Debit</span>
              <span className="text-xs font-medium text-muted-foreground uppercase text-right">Credit</span>
              <span></span>
            </div>

            {/* Lines */}
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.id} className="grid grid-cols-[1fr_1fr_120px_120px_32px] gap-2 items-center">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={line.accountId}
                    onChange={e => updateLine(line.id, 'accountId', e.target.value)}
                  >
                    <option value="">Select account...</option>
                    {activeAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Line description"
                    value={line.description}
                    onChange={e => updateLine(line.id, 'description', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="text-right font-mono"
                    value={line.debit}
                    onChange={e => updateLine(line.id, 'debit', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="text-right font-mono"
                    value={line.credit}
                    onChange={e => updateLine(line.id, 'credit', e.target.value)}
                  />
                  <button
                    className={cn(
                      'p-1 rounded hover:bg-accent transition-colors',
                      lines.length <= 2 && 'opacity-30 cursor-not-allowed'
                    )}
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 2}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-[1fr_1fr_120px_120px_32px] gap-2 mt-3 px-2 pt-3 border-t border-border">
              <span className="text-sm font-semibold">Totals</span>
              <span></span>
              <span className="text-sm font-mono font-semibold text-right">
                {totalDebit.toFixed(2)}
              </span>
              <span className="text-sm font-mono font-semibold text-right">
                {totalCredit.toFixed(2)}
              </span>
              <span></span>
            </div>

            {/* Balance indicator */}
            {totalDebit > 0 || totalCredit > 0 ? (
              <div className={cn(
                'mt-2 px-3 py-2 rounded-lg text-sm',
                isBalanced
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              )}>
                {isBalanced
                  ? 'Journal is balanced'
                  : `Out of balance by ${Math.abs(difference).toFixed(2)} (${difference > 0 ? 'debits exceed credits' : 'credits exceed debits'})`
                }
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !isBalanced || !description.trim()}
          >
            {saving ? 'Creating...' : 'Create Draft Journal'}
          </Button>
        </div>
      </div>
    </div>
  )
}
