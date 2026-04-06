import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type Contact, type Account, type Bill } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface BillLineForm {
  id: string
  description: string
  accountId: string
  quantity: number
  unitPrice: number
  taxAmount: number
}

interface CreateBillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingBill?: Bill | null
}

export default function CreateBillModal({
  open,
  onOpenChange,
  onSuccess,
  editingBill,
}: CreateBillModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [contactId, setContactId] = useState('')
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<BillLineForm[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Load contacts and accounts
  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      try {
        setLoadingData(true)
        const [contactsData, accountsData] = await Promise.all([
          api.get<Contact[]>('/contacts'),
          api.get<Account[]>('/accounts'),
        ])
        setContacts(
          contactsData.filter((c) => c.contactType === 'SUPPLIER' || c.contactType === 'BOTH')
        )
        setAccounts(accountsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [open])

  // Load existing bill
  useEffect(() => {
    if (editingBill) {
      setContactId(editingBill.contactId)
      setIssueDate(editingBill.issueDate)
      setDueDate(editingBill.dueDate)
      setReference(editingBill.reference || '')
      setNotes(editingBill.notes || '')
      setLines(
        editingBill.lines.map((line) => ({
          id: line.id,
          description: line.description,
          accountId: line.accountId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxAmount: line.taxAmount,
        }))
      )
    } else {
      setContactId('')
      setIssueDate(new Date().toISOString().split('T')[0])
      setDueDate('')
      setReference('')
      setNotes('')
      setLines([])
    }
    setError(null)
  }, [editingBill, open])

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        accountId: '',
        quantity: 1,
        unitPrice: 0,
        taxAmount: 0,
      },
    ])
  }

  const removeLine = (id: string) => {
    setLines(lines.filter((line) => line.id !== id))
  }

  const updateLine = (id: string, updates: Partial<BillLineForm>) => {
    setLines(
      lines.map((line) => (line.id === id ? { ...line, ...updates } : line))
    )
  }

  const calculateLineTotal = (line: BillLineForm) => {
    return line.quantity * line.unitPrice + line.taxAmount
  }

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  const taxTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0)
  const total = subtotal + taxTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (!contactId || lines.length === 0) {
        throw new Error('Please select a supplier and add at least one line item')
      }

      const payload = {
        contactId,
        issueDate,
        dueDate,
        reference: reference || null,
        notes: notes || null,
        lines: lines.map((line) => ({
          description: line.description,
          accountId: line.accountId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxAmount: line.taxAmount,
        })),
      }

      if (editingBill) {
        await api.patch(`/bills/${editingBill.id}`, payload)
      } else {
        await api.post('/bills', payload)
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bill')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{editingBill ? 'Edit Bill' : 'New Bill'}</CardTitle>
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

            {/* Contact & Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Supplier <span className="text-red-400">*</span>
                </label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  required
                  disabled={loadingData}
                  className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
                >
                  <option value="">Select a supplier</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Issue Date</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reference</label>
                <Input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Bill number or reference"
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes"
                  className="bg-card"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold mb-3">Line Items</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lines.map((line) => (
                  <div key={line.id} className="grid grid-cols-6 gap-2 items-end">
                    <div>
                      <label className="text-xs text-muted-foreground">Description</label>
                      <Input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.id, { description: e.target.value })
                        }
                        placeholder="Item description"
                        className="bg-card"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Account</label>
                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(line.id, { accountId: e.target.value })
                        }
                        className="w-full px-2 py-2 rounded-md border border-border bg-card text-foreground text-sm"
                      >
                        <option value="">Select</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="bg-card"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit Price</label>
                      <Input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="bg-card"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Tax</label>
                      <Input
                        type="number"
                        value={line.taxAmount}
                        onChange={(e) =>
                          updateLine(line.id, { taxAmount: parseFloat(e.target.value) || 0 })
                        }
                        className="bg-card"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {formatCurrency(calculateLineTotal(line))}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLine}
                className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </button>
            </div>

            {/* Totals */}
            <div className="bg-card/50 border border-border rounded-md p-4 space-y-2">
              <div className="flex justify-end gap-4 text-sm">
                <span>Subtotal:</span>
                <span className="w-32 text-right">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-end gap-4 text-sm">
                <span>Tax:</span>
                <span className="w-32 text-right">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-end gap-4 text-base font-semibold pt-2 border-t border-border">
                <span>Total:</span>
                <span className="w-32 text-right">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting || loadingData}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || loadingData || !contactId || lines.length === 0}
              >
                {submitting ? 'Saving...' : editingBill ? 'Update Bill' : 'Create Bill'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
