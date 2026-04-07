import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { api, type VatReturn } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface SubmitReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vatReturn: VatReturn | null
  onSuccess: () => void
}

export default function SubmitReturnModal({
  open,
  onOpenChange,
  vatReturn,
  onSuccess,
}: SubmitReturnModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open || !vatReturn) return null

  const handleSubmit = async () => {
    if (!confirmed) {
      setError('You must confirm the return is correct')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await api.post(`/vat/returns/${vatReturn.id}/submit`, {})
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit VAT return')
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
            <CardTitle className="text-red-400">Confirm VAT Return Submission</CardTitle>
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
              You are about to submit this VAT return to HMRC via Making Tax Digital.
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. By submitting you confirm the information is correct.
            </p>
          </div>

          {/* Amount to Pay */}
          <div className={`p-4 rounded-lg border-2 ${
            vatReturn.box5 > 0
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <p className="text-xs text-muted-foreground mb-1">Total VAT Due</p>
            <p className={`text-2xl font-bold ${
              vatReturn.box5 > 0
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}>
              {formatCurrency(vatReturn.box5)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {vatReturn.box5 > 0
                ? 'Amount you owe to HMRC'
                : 'Refund you are entitled to'}
            </p>
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
              I confirm this return is correct and I'm authorised to submit it to HMRC
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
