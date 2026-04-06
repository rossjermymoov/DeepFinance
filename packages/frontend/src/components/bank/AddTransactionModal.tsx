import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type BankTransaction } from '../../lib/api'

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  bankAccountId: string
}

interface FormData {
  transactionDate: string
  description: string
  reference: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
}

const initialFormData: FormData = {
  transactionDate: new Date().toISOString().split('T')[0],
  description: '',
  reference: '',
  amount: 0,
  type: 'DEBIT',
}

export default function AddTransactionModal({
  open,
  onOpenChange,
  onSuccess,
  bankAccountId,
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setFormData(initialFormData)
    setError(null)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const payload = {
        bankAccountId,
        transactionDate: formData.transactionDate,
        description: formData.description,
        reference: formData.reference || null,
        amount: Math.round(formData.amount * 100),
        type: formData.type,
      }

      await api.post<BankTransaction>('/bank-transactions', payload)

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Add Transaction</CardTitle>
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

            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Transaction Date <span className="text-red-400">*</span>
              </label>
              <Input
                type="date"
                value={formData.transactionDate}
                onChange={(e) =>
                  setFormData({ ...formData, transactionDate: e.target.value })
                }
                required
                className="bg-card"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Transaction description"
                required
                className="bg-card"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium mb-2">Reference</label>
              <Input
                type="text"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="Reference code or note"
                className="bg-card"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
                className="bg-card"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Type <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                {(['CREDIT', 'DEBIT'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={formData.type === type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as FormData['type'],
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      {type === 'CREDIT' ? 'Money In (Credit)' : 'Money Out (Debit)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.description || !formData.transactionDate}
              >
                {submitting ? 'Adding...' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
