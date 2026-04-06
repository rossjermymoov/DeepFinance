import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { api, type Account } from '../../lib/api'
import { cn } from '../../lib/utils'

interface CreateAccountModalProps {
  accounts: Account[]
  onClose: () => void
  onCreated: (account: Account) => void
  editAccount?: Account | null
}

const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
]

const ACCOUNT_SUB_TYPES: Record<string, { value: string; label: string }[]> = {
  ASSET: [
    { value: 'CURRENT_ASSET', label: 'Current Asset' },
    { value: 'FIXED_ASSET', label: 'Fixed Asset' },
    { value: 'BANK', label: 'Bank' },
    { value: 'ACCOUNTS_RECEIVABLE', label: 'Accounts Receivable' },
    { value: 'PREPAYMENT', label: 'Prepayment' },
    { value: 'INVENTORY', label: 'Inventory' },
  ],
  LIABILITY: [
    { value: 'CURRENT_LIABILITY', label: 'Current Liability' },
    { value: 'LONG_TERM_LIABILITY', label: 'Long-term Liability' },
    { value: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable' },
    { value: 'VAT_LIABILITY', label: 'VAT Liability' },
    { value: 'ACCRUAL', label: 'Accrual' },
  ],
  EQUITY: [
    { value: 'SHARE_CAPITAL', label: 'Share Capital' },
    { value: 'RETAINED_EARNINGS', label: 'Retained Earnings' },
    { value: 'RESERVES', label: 'Reserves' },
  ],
  INCOME: [
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'OTHER_INCOME', label: 'Other Income' },
  ],
  EXPENSE: [
    { value: 'DIRECT_COST', label: 'Direct Cost' },
    { value: 'OVERHEAD', label: 'Overhead' },
    { value: 'DEPRECIATION', label: 'Depreciation' },
    { value: 'TAX_EXPENSE', label: 'Tax Expense' },
  ],
}

export default function CreateAccountModal({
  accounts,
  onClose,
  onCreated,
  editAccount,
}: CreateAccountModalProps) {
  const isEditing = !!editAccount
  const [code, setCode] = useState(editAccount?.code ?? '')
  const [name, setName] = useState(editAccount?.name ?? '')
  const [description, setDescription] = useState(editAccount?.description ?? '')
  const [accountType, setAccountType] = useState(editAccount?.type ?? '')
  const [accountSubType, setAccountSubType] = useState(editAccount?.subType ?? '')
  const [parentAccountId, setParentAccountId] = useState(editAccount?.parentAccountId ?? '')
  const [currency, setCurrency] = useState(editAccount?.currency ?? 'GBP')
  const [isBankAccount, setIsBankAccount] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter potential parent accounts to same type
  const parentOptions = accounts.filter(
    (a) => a.type === accountType && a.isActive && a.id !== editAccount?.id
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!code.trim() || !name.trim() || !accountType || !accountSubType) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    try {
      if (isEditing && editAccount) {
        const updated = await api.patch<Account>(`/accounts/${editAccount.id}`, {
          name: name.trim(),
          description: description.trim() || undefined,
        })
        onCreated(updated)
      } else {
        const created = await api.post<Account>('/accounts', {
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          accountType,
          accountSubType,
          parentAccountId: parentAccountId || undefined,
          currency: currency || 'GBP',
          isBankAccount,
        })
        onCreated(created)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Account' : 'Create Account'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Code & Name row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Code <span className="text-red-400">*</span>
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="1001"
                  maxLength={20}
                  disabled={isEditing}
                  className={cn(isEditing && 'opacity-50 cursor-not-allowed')}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Current Account"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional account description..."
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Account Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Account Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={accountType}
                  onChange={(e) => {
                    setAccountType(e.target.value)
                    setAccountSubType('')
                    setParentAccountId('')
                  }}
                  disabled={isEditing}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isEditing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <option value="">Select type...</option>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Sub-type <span className="text-red-400">*</span>
                </label>
                <select
                  value={accountSubType}
                  onChange={(e) => setAccountSubType(e.target.value)}
                  disabled={isEditing || !accountType}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    (isEditing || !accountType) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <option value="">Select sub-type...</option>
                  {accountType &&
                    ACCOUNT_SUB_TYPES[accountType]?.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Parent Account */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Parent Account
              </label>
              <select
                value={parentAccountId}
                onChange={(e) => setParentAccountId(e.target.value)}
                disabled={isEditing || !accountType}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  (isEditing || !accountType) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <option value="">None (top-level account)</option>
                {parentOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency & Bank Account */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isEditing}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isEditing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="CHF">CHF — Swiss Franc</option>
                </select>
              </div>

              {!isEditing && accountType === 'ASSET' && (
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBankAccount}
                      onChange={(e) => setIsBankAccount(e.target.checked)}
                      className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-sm">This is a bank account</span>
                  </label>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? isEditing
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
