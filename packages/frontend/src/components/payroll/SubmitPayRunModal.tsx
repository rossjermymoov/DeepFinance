import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { api, type PayRun } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/utils'

interface SubmitPayRunModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payRun: PayRun | null
  onSuccess: () => void
}

export default function SubmitPayRunModal({
  open,
  onOpenChange,
  payRun,
  onSuccess,
}: SubmitPayRunModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open || !payRun) return null

  const handleSubmit = async () => {
    if (!confirmed) {
      setError('You must confirm the pay run data is accurate')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await api.post(`/payroll/pay-runs/${payRun.id}/submit`, {})
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit pay run')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md m-4 border-red-500/30 bg-red-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <CardTitle className="text-red-400">Confirm RTI Submission</CardTitle>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Warning Message */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              You are about to submit this pay run to HMRC via Real Time Information (RTI).
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. By submitting you confirm the payroll information is correct and you are authorized to submit it.
            </p>
          </div>

          {/* Pay Run Summary */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border">
            <div>
              <p className="text-xs text-muted-foreground">Pay Run Number</p>
              <p className="font-mono text-sm font-medium">{payRun.payRunNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="font-medium">
                  {formatDate(payRun.periodStart)} - {formatDate(payRun.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employees</p>
                <p className="font-medium">{payRun.employeeCount}</p>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Gross Pay</span>
              <span className="font-medium">{formatCurrency(payRun.totalGrossPay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tax</span>
              <span className="font-medium text-red-400">{formatCurrency(payRun.totalTaxDeducted)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total NI (Ee + Er)</span>
              <span className="font-medium text-amber-400">
                {formatCurrency(payRun.totalNiEmployee + payRun.totalNiEmployer)}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span>Total Net Pay</span>
              <span className="text-emerald-400">{formatCurrency(payRun.totalNetPay)}</span>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border border-border cursor-pointer"
            />
            <span className="text-sm font-medium">
              I confirm this pay run data is accurate and I'm authorized to submit it to HMRC via RTI
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Submitting...' : 'Submit to HMRC'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
