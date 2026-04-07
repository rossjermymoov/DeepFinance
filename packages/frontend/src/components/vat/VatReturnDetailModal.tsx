import { X, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { type VatReturn } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/utils'

interface VatReturnDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vatReturn: VatReturn | null
  onRecalculate: (id: string) => void
  onReview: (id: string) => void
  onSubmit: (id: string) => void
  loading?: boolean
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="warning">{status}</Badge>
    case 'CALCULATED':
      return <Badge variant="warning">{status}</Badge>
    case 'REVIEWED':
      return <Badge variant="secondary">{status}</Badge>
    case 'SUBMITTED':
      return <Badge variant="warning">SUBMITTED (Awaiting HMRC)</Badge>
    case 'ACCEPTED':
      return <Badge variant="success">{status}</Badge>
    case 'REJECTED':
      return <Badge variant="error">{status}</Badge>
    case 'AMENDED':
      return <Badge variant="warning">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function VatReturnDetailModal({
  open,
  onOpenChange,
  vatReturn,
  onRecalculate,
  onReview,
  onSubmit,
  loading,
}: VatReturnDetailModalProps) {
  if (!open || !vatReturn) return null

  const canRecalculate = vatReturn.status === 'DRAFT' || vatReturn.status === 'CALCULATED'
  const canReview = vatReturn.status === 'CALCULATED'
  const canSubmit = vatReturn.status === 'REVIEWED'

  const handleCopyBox5 = async () => {
    await navigator.clipboard.writeText(formatCurrency(vatReturn.box5))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>VAT Return {vatReturn.periodStart} to {vatReturn.periodEnd}</CardTitle>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Scheme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="mt-1"><StatusBadge status={vatReturn.status} /></p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheme</p>
              <p className="mt-1 text-sm font-medium">{vatReturn.vatSchemeUsed}</p>
            </div>
          </div>

          {/* VAT Box Display */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 p-4">
              <h3 className="font-semibold mb-4">VAT Return Boxes</h3>

              <div className="space-y-4">
                {/* Box 1-3 */}
                <div className="bg-card p-3 rounded border border-border/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Box 1</p>
                      <p className="text-sm font-medium">VAT due on sales</p>
                      <p className="text-lg font-bold mt-1">{formatCurrency(vatReturn.box1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Box 2</p>
                      <p className="text-sm font-medium">VAT on acquisitions</p>
                      <p className="text-lg font-bold mt-1">{formatCurrency(vatReturn.box2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Box 3</p>
                    <p className="text-sm font-medium">Total VAT due</p>
                    <p className="text-lg font-bold mt-1">{formatCurrency(vatReturn.box3)}</p>
                  </div>
                </div>

                {/* Box 4 */}
                <div className="bg-card p-3 rounded border border-border/50">
                  <p className="text-xs text-muted-foreground">Box 4</p>
                  <p className="text-sm font-medium">VAT reclaimed on purchases</p>
                  <p className="text-lg font-bold mt-1">{formatCurrency(vatReturn.box4)}</p>
                </div>

                {/* Box 5 - Highlighted */}
                <div className={`p-4 rounded-lg border-2 ${
                  vatReturn.box5 > 0
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <p className="text-xs text-muted-foreground">Box 5</p>
                  <p className="text-sm font-medium">Net VAT to pay/reclaim</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-2xl font-bold ${
                      vatReturn.box5 > 0
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}>
                      {formatCurrency(vatReturn.box5)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyBox5}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {vatReturn.box5 > 0 ? 'Amount owed to HMRC' : 'Refund due'}
                  </p>
                </div>

                {/* Boxes 6-9 */}
                <div className="grid grid-cols-2 gap-3 bg-card p-3 rounded border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Box 6</p>
                    <p className="text-sm font-medium">Total sales ex VAT</p>
                    <p className="text-base font-bold mt-1">{formatCurrency(vatReturn.box6)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Box 7</p>
                    <p className="text-sm font-medium">Total purchases ex VAT</p>
                    <p className="text-base font-bold mt-1">{formatCurrency(vatReturn.box7)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Box 8</p>
                    <p className="text-sm font-medium">Goods to EU</p>
                    <p className="text-base font-bold mt-1">{formatCurrency(vatReturn.box8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Box 9</p>
                    <p className="text-sm font-medium">Goods from EU</p>
                    <p className="text-base font-bold mt-1">{formatCurrency(vatReturn.box9)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {vatReturn.calculatedAt && (
              <div>
                <p className="text-muted-foreground">Calculated At</p>
                <p className="font-medium">{formatDate(vatReturn.calculatedAt)}</p>
              </div>
            )}
            {vatReturn.submittedAt && (
              <div>
                <p className="text-muted-foreground">Submitted At</p>
                <p className="font-medium">{formatDate(vatReturn.submittedAt)}</p>
              </div>
            )}
            {vatReturn.hmrcReceiptId && (
              <div className="col-span-2">
                <p className="text-muted-foreground">HMRC Receipt ID</p>
                <p className="font-mono text-xs">{vatReturn.hmrcReceiptId}</p>
              </div>
            )}
          </div>

          {vatReturn.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm mt-2 p-3 bg-secondary/30 rounded border border-border/50">
                {vatReturn.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            {canRecalculate && (
              <Button
                variant="outline"
                onClick={() => onRecalculate(vatReturn.id)}
                disabled={loading}
              >
                Recalculate
              </Button>
            )}
            {canReview && (
              <Button
                variant="outline"
                onClick={() => onReview(vatReturn.id)}
                disabled={loading}
              >
                Mark as Reviewed
              </Button>
            )}
            {canSubmit && (
              <Button
                onClick={() => onSubmit(vatReturn.id)}
                disabled={loading}
              >
                Review & Submit
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
