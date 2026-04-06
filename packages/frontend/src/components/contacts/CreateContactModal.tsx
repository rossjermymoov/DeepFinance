import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type Contact } from '../../lib/api'

interface CreateContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingContact?: Contact | null
  isLoading?: boolean
}

interface FormData {
  name: string
  contactType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH'
  email: string
  phone: string
  companyName: string
  taxNumber: string
  accountNumber: string
  defaultPaymentTermsDays: number
  billingAddressLine1: string
  billingAddressLine2: string
  billingAddressCity: string
  billingAddressCounty: string
  billingAddressPostcode: string
  billingAddressCountry: string
  currency: string
  notes: string
}

const initialFormData: FormData = {
  name: '',
  contactType: 'CUSTOMER',
  email: '',
  phone: '',
  companyName: '',
  taxNumber: '',
  accountNumber: '',
  defaultPaymentTermsDays: 0,
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingAddressCity: '',
  billingAddressCounty: '',
  billingAddressPostcode: '',
  billingAddressCountry: '',
  currency: 'GBP',
  notes: '',
}

export default function CreateContactModal({
  open,
  onOpenChange,
  onSuccess,
  editingContact,
  isLoading = false,
}: CreateContactModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingContact) {
      setFormData({
        name: editingContact.name,
        contactType: editingContact.contactType,
        email: editingContact.email || '',
        phone: editingContact.phone || '',
        companyName: editingContact.companyName || '',
        taxNumber: editingContact.taxNumber || '',
        accountNumber: editingContact.accountNumber || '',
        defaultPaymentTermsDays: editingContact.defaultPaymentTermsDays,
        billingAddressLine1: editingContact.billingAddress?.line1 || '',
        billingAddressLine2: editingContact.billingAddress?.line2 || '',
        billingAddressCity: editingContact.billingAddress?.city || '',
        billingAddressCounty: editingContact.billingAddress?.county || '',
        billingAddressPostcode: editingContact.billingAddress?.postcode || '',
        billingAddressCountry: editingContact.billingAddress?.country || '',
        currency: editingContact.currency,
        notes: editingContact.notes || '',
      })
    } else {
      setFormData(initialFormData)
    }
    setError(null)
  }, [editingContact, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        contactType: formData.contactType,
        email: formData.email || null,
        phone: formData.phone || null,
        companyName: formData.companyName || null,
        taxNumber: formData.taxNumber || null,
        accountNumber: formData.accountNumber || null,
        defaultPaymentTermsDays: formData.defaultPaymentTermsDays,
        billingAddress: {
          line1: formData.billingAddressLine1,
          line2: formData.billingAddressLine2 || undefined,
          city: formData.billingAddressCity,
          county: formData.billingAddressCounty || undefined,
          postcode: formData.billingAddressPostcode,
          country: formData.billingAddressCountry,
        },
        currency: formData.currency,
        notes: formData.notes || null,
      }

      if (editingContact) {
        await api.patch(`/contacts/${editingContact.id}`, payload)
      } else {
        await api.post('/contacts', payload)
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{editingContact ? 'Edit Contact' : 'New Contact'}</CardTitle>
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

            {/* Contact Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Contact Type</label>
              <div className="flex gap-4">
                {(['CUSTOMER', 'SUPPLIER', 'BOTH'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactType"
                      value={type}
                      checked={formData.contactType === type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactType: e.target.value as FormData['contactType'],
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact name"
                required
                className="bg-card"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <Input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Company name"
                className="bg-card"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="bg-card"
                />
              </div>
            </div>

            {/* Tax & Account Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tax Number</label>
                <Input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, taxNumber: e.target.value })
                  }
                  placeholder="Tax ID"
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <Input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  placeholder="Account number"
                  className="bg-card"
                />
              </div>
            </div>

            {/* Payment Terms & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Payment Terms (Days)
                </label>
                <Input
                  type="number"
                  value={formData.defaultPaymentTermsDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultPaymentTermsDays: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <Input
                  type="text"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  placeholder="GBP"
                  className="bg-card"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold mb-3">Billing Address</h3>
              <div className="space-y-3">
                <Input
                  type="text"
                  value={formData.billingAddressLine1}
                  onChange={(e) =>
                    setFormData({ ...formData, billingAddressLine1: e.target.value })
                  }
                  placeholder="Address line 1"
                  className="bg-card"
                />
                <Input
                  type="text"
                  value={formData.billingAddressLine2}
                  onChange={(e) =>
                    setFormData({ ...formData, billingAddressLine2: e.target.value })
                  }
                  placeholder="Address line 2"
                  className="bg-card"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    value={formData.billingAddressCity}
                    onChange={(e) =>
                      setFormData({ ...formData, billingAddressCity: e.target.value })
                    }
                    placeholder="City"
                    className="bg-card"
                  />
                  <Input
                    type="text"
                    value={formData.billingAddressCounty}
                    onChange={(e) =>
                      setFormData({ ...formData, billingAddressCounty: e.target.value })
                    }
                    placeholder="County"
                    className="bg-card"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    value={formData.billingAddressPostcode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingAddressPostcode: e.target.value,
                      })
                    }
                    placeholder="Postcode"
                    className="bg-card"
                  />
                  <Input
                    type="text"
                    value={formData.billingAddressCountry}
                    onChange={(e) =>
                      setFormData({ ...formData, billingAddressCountry: e.target.value })
                    }
                    placeholder="Country"
                    className="bg-card"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || isLoading || !formData.name}
              >
                {submitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
