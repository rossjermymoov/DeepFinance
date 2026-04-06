import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type TaxRate } from '../../lib/api'

interface CreateTaxRateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingTaxRate?: TaxRate | null
}

interface FormData {
  name: string
  code: string
  rate: number
  description: string
  isDefault: boolean
  effectiveFrom: string
  effectiveTo: string
}

const initialFormData: FormData = {
  name: '',
  code: '',
  rate: 0,
  description: '',
  isDefault: false,
  effectiveFrom: '',
  effectiveTo: '',
}

export default function CreateTaxRateModal({
  open,
  onOpenChange,
  onSuccess,
  editingTaxRate,
}: CreateTaxRateModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingTaxRate) {
      setFormData({
        name: editingTaxRate.name,
        code: editingTaxRate.code,
        rate: editingTaxRate.rate,
        description: editingTaxRate.description || '',
        isDefault: editingTaxRate.isDefault,
        effectiveFrom: editingTaxRate.effectiveFrom.split('T')[0],
        effectiveTo: editingTaxRate.effectiveTo
          ? editingTaxRate.effectiveTo.split('T')[0]
          : '',
      })
    } else {
      setFormData(initialFormData)
    }
    setError(null)
  }, [editingTaxRate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        rate: formData.rate,
        description: formData.description || null,
        isDefault: formData.isDefault,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || null,
      }

      if (editingTaxRate) {
        await api.patch(`/tax-rates/${editingTaxRate.id}`, payload)
      } else {
        await api.post('/tax-rates', payload)
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tax rate')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>
            {editingTaxRate ? 'Edit Tax Rate' : 'New Tax Rate'}
          </CardTitle>
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

            {/* Name & Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VAT, Sales Tax, etc."
                  required
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Code <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VAT20, SALES_TAX, etc."
                  required
                  className="bg-card"
                />
              </div>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Rate (%) <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                }
                placeholder="20.00"
                required
                className="bg-card"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description for this tax rate"
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
              />
            </div>

            {/* Effective Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Effective From <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveFrom: e.target.value })
                  }
                  required
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Effective To</label>
                <Input
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveTo: e.target.value })
                  }
                  className="bg-card"
                />
              </div>
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="w-4 h-4 rounded border border-border"
              />
              <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                Set as default tax rate
              </label>
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
                disabled={submitting || !formData.name || !formData.code || !formData.effectiveFrom}
              >
                {submitting
                  ? 'Saving...'
                  : editingTaxRate
                    ? 'Update Tax Rate'
                    : 'Create Tax Rate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
