import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/utils'

interface CreatePayRunModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreatePayRunModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePayRunModalProps) {
  const [payFrequency, setPayFrequency] = useState<'WEEKLY' | 'FORTNIGHTLY' | 'FOUR_WEEKLY' | 'MONTHLY'>('MONTHLY')
  const [taxPeriod, setTaxPeriod] = useState(1)
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [employeeCount, setEmployeeCount] = useState(0)

  useEffect(() => {
    if (open) {
      // Set default payment date to next Monday
      const today = new Date()
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + daysUntilMonday)
      const dateString = nextMonday.toISOString().split('T')[0]
      setPaymentDate(dateString)
    }
  }, [open])

  // Load employee count for this frequency
  useEffect(() => {
    if (open) {
      api.get<{ count: number }>(`/payroll/employees/count?payFrequency=${payFrequency}`)
        .then(data => setEmployeeCount(data.count))
        .catch(() => setEmployeeCount(0))
    }
  }, [payFrequency, open])

  const periodOptions = useMemo(() => {
    if (payFrequency === 'MONTHLY') {
      return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Month ${i + 1}`,
      }))
    } else if (payFrequency === 'WEEKLY') {
      return Array.from({ length: 52 }, (_, i) => ({
        value: i + 1,
        label: `Week ${i + 1}`,
      }))
    } else if (payFrequency === 'FORTNIGHTLY') {
      return Array.from({ length: 26 }, (_, i) => ({
        value: i + 1,
        label: `Fortnight ${i + 1}`,
      }))
    } else {
      // FOUR_WEEKLY
      return Array.from({ length: 13 }, (_, i) => ({
        value: i + 1,
        label: `Period ${i + 1}`,
      }))
    }
  }, [payFrequency])

  const periodDates = useMemo(() => {
    // Calculate start and end dates based on tax period
    // This is a simplified calculation; in production, this would be based on actual tax year
    const taxYearStart = new Date(new Date().getFullYear(), 3, 6) // 6 April
    let startDate = new Date(taxYearStart)
    let endDate = new Date(taxYearStart)

    if (payFrequency === 'MONTHLY') {
      startDate.setMonth(taxYearStart.getMonth() + taxPeriod - 1)
      endDate.setMonth(taxYearStart.getMonth() + taxPeriod)
      endDate.setDate(0)
    } else if (payFrequency === 'WEEKLY') {
      startDate.setDate(taxYearStart.getDate() + (taxPeriod - 1) * 7)
      endDate.setDate(startDate.getDate() + 6)
    } else if (payFrequency === 'FORTNIGHTLY') {
      startDate.setDate(taxYearStart.getDate() + (taxPeriod - 1) * 14)
      endDate.setDate(startDate.getDate() + 13)
    } else {
      startDate.setDate(taxYearStart.getDate() + (taxPeriod - 1) * 28)
      endDate.setDate(startDate.getDate() + 27)
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }, [taxPeriod, payFrequency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentDate) {
      setError('Please select a payment date')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await api.post('/payroll/pay-runs', {
        payFrequency,
        taxPeriod,
        periodStart: periodDates.start,
        periodEnd: periodDates.end,
        paymentDate,
        notes: notes || null,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pay run')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Create Pay Run</CardTitle>
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

            {/* Pay Frequency */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Pay Frequency <span className="text-red-400">*</span>
              </label>
              <select
                value={payFrequency}
                onChange={(e) => {
                  setPayFrequency(e.target.value as any)
                  setTaxPeriod(1)
                }}
                className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="FORTNIGHTLY">Fortnightly</option>
                <option value="FOUR_WEEKLY">Four-Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {/* Tax Period */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tax Period <span className="text-red-400">*</span>
              </label>
              <select
                value={taxPeriod}
                onChange={(e) => setTaxPeriod(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Dates Display */}
            <div className="p-3 bg-secondary/30 border border-border rounded-md text-sm">
              <p className="text-muted-foreground text-xs mb-1">Period</p>
              <p className="font-medium">
                {formatDate(periodDates.start)} to {formatDate(periodDates.end)}
              </p>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Date <span className="text-red-400">*</span>
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-card"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this pay run"
                className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm"
                rows={3}
              />
            </div>

            {/* Preview */}
            <div className="p-3 bg-secondary/30 border border-border rounded-md text-sm">
              <p className="text-muted-foreground text-xs mb-1">Preview</p>
              <p className="font-medium">{employeeCount} employees will be included</p>
              <p className="text-xs text-muted-foreground mt-1">
                Matching {payFrequency.toLowerCase()} pay frequency
              </p>
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
                {submitting ? 'Creating...' : 'Create Pay Run'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
