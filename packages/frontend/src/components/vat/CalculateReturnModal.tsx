import { useState } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api } from '../../lib/api'

interface CalculateReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  scheme: string
}

export default function CalculateReturnModal({
  open,
  onOpenChange,
  onSuccess,
  scheme,
}: CalculateReturnModalProps) {
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setQuickPeriod = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    const year = new Date().getFullYear()
    const periods: Record<string, [string, string]> = {
      Q1: [`${year}-04-01`, `${year}-06-30`],
      Q2: [`${year}-07-01`, `${year}-09-30`],
      Q3: [`${year}-10-01`, `${year}-12-31`],
      Q4: [`${year}-01-01`, `${year}-03-31`],
    }
    const [start, end] = periods[quarter]
    setPeriodStart(start)
    setPeriodEnd(end)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!periodStart || !periodEnd) {
      setError('Please select both start and end dates')
      return
    }

    if (new Date(periodStart) >= new Date(periodEnd)) {
      setError('Start date must be before end date')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/vat/returns/calculate', {
        periodStart,
        periodEnd,
      })
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate VAT return')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Calculate VAT Return</CardTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Period Selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Period Start <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="bg-card"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Period End <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Select:</p>
              <div className="grid grid-cols-4 gap-2">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickPeriod(q)}
                    className="text-xs"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>

            {/* Info Text */}
            <div className="p-3 bg-secondary/30 border border-border rounded-md text-sm text-muted-foreground">
              This will calculate your VAT return based on your {scheme} scheme settings.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Calculating...' : 'Calculate Return'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
