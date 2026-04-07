import { useEffect, useState } from 'react'
import { X, Check, LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { api, type VatSettings } from '../lib/api'
import { formatDate } from '../lib/utils'

export default function VatSettingsPage() {
  const [settings, setSettings] = useState<VatSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [isRegistered, setIsRegistered] = useState(false)
  const [vatNumber, setVatNumber] = useState('')
  const [vatScheme, setVatScheme] = useState<'STANDARD' | 'FLAT_RATE' | 'CASH_ACCOUNTING'>('STANDARD')
  const [flatRatePercentage, setFlatRatePercentage] = useState('')
  const [flatRateCategory, setFlatRateCategory] = useState('')
  const [returnFrequency, setReturnFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('QUARTERLY')
  const [staggerGroup, setStaggerGroup] = useState('')

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await api.get<VatSettings>('/vat/settings')
      setSettings(data)

      // Populate form
      setIsRegistered(data.isRegistered)
      setVatNumber(data.vatNumber || '')
      setVatScheme(data.vatScheme)
      setFlatRatePercentage(data.flatRatePercentage ? data.flatRatePercentage.toString() : '')
      setFlatRateCategory(data.flatRateCategory || '')
      setReturnFrequency(data.returnFrequency)
      setStaggerGroup(data.staggerGroup ? data.staggerGroup.toString() : '')

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VAT settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isRegistered && !vatNumber) {
      setError('VAT number is required when registration is enabled')
      return
    }

    if (vatScheme === 'FLAT_RATE' && !flatRatePercentage) {
      setError('Flat rate percentage is required for Flat Rate scheme')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await api.patch('/vat/settings', {
        isRegistered,
        vatNumber: isRegistered ? vatNumber : null,
        vatScheme,
        flatRatePercentage: vatScheme === 'FLAT_RATE' ? parseFloat(flatRatePercentage) : null,
        flatRateCategory: vatScheme === 'FLAT_RATE' ? flatRateCategory : null,
        returnFrequency,
        staggerGroup: staggerGroup ? parseInt(staggerGroup) : null,
      })

      setSuccess('VAT settings saved successfully')
      await loadSettings()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save VAT settings')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectHmrc = () => {
    // In production, this would redirect to HMRC OAuth
    const oauthUrl = `${import.meta.env.VITE_API_URL || ''}/auth/hmrc/authorize`
    window.location.href = oauthUrl
  }

  const handleDisconnectHmrc = async () => {
    if (!confirm('Are you sure you want to disconnect from HMRC? You will need to reconnect to submit returns.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      await api.post('/vat/settings/disconnect-hmrc', {})
      await loadSettings()
      setSuccess('Disconnected from HMRC')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from HMRC')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading VAT settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">VAT Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your VAT registration and HMRC connection</p>
      </div>

      {/* Messages */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6 flex items-start justify-between">
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-500/10 rounded-md ml-4"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6 flex items-start justify-between">
            <p className="text-emerald-400 text-sm flex-1">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="p-1 hover:bg-emerald-500/10 rounded-md ml-4"
            >
              <X className="w-4 h-4 text-emerald-400" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* VAT Registration Section */}
      <Card>
        <CardHeader>
          <CardTitle>VAT Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Registration Toggle */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/30 transition-colors border border-border/50">
                <input
                  type="checkbox"
                  checked={isRegistered}
                  onChange={(e) => setIsRegistered(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border border-border cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-medium">VAT Registered</p>
                  <p className="text-sm text-muted-foreground">
                    Enable this if you are registered for VAT with HMRC
                  </p>
                </div>
              </label>
            </div>

            {isRegistered && (
              <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
                {/* VAT Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    VAT Number <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
                    placeholder="GB123456789"
                    className="bg-card"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: GB followed by 9 digits
                  </p>
                </div>

                {/* VAT Scheme */}
                <div>
                  <label className="block text-sm font-medium mb-2">VAT Scheme</label>
                  <select
                    value={vatScheme}
                    onChange={(e) => setVatScheme(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
                  >
                    <option value="STANDARD">Standard Rate</option>
                    <option value="FLAT_RATE">Flat Rate</option>
                    <option value="CASH_ACCOUNTING">Cash Accounting</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vatScheme === 'STANDARD' && 'Standard VAT scheme with input tax recovery'}
                    {vatScheme === 'FLAT_RATE' && 'Simplified scheme with fixed percentage calculation'}
                    {vatScheme === 'CASH_ACCOUNTING' && 'Report VAT based on actual cash received/paid'}
                  </p>
                </div>

                {/* Flat Rate Fields */}
                {vatScheme === 'FLAT_RATE' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Flat Rate % <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={flatRatePercentage}
                        onChange={(e) => setFlatRatePercentage(e.target.value)}
                        placeholder="16.5"
                        className="bg-card"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Category</label>
                      <Input
                        type="text"
                        value={flatRateCategory}
                        onChange={(e) => setFlatRateCategory(e.target.value)}
                        placeholder="e.g. Professional services"
                        className="bg-card"
                      />
                    </div>
                  </div>
                )}

                {/* Return Frequency */}
                <div>
                  <label className="block text-sm font-medium mb-2">Return Frequency</label>
                  <select
                    value={returnFrequency}
                    onChange={(e) => setReturnFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>

                {/* Stagger Group */}
                <div>
                  <label className="block text-sm font-medium mb-2">Stagger Group (Optional)</label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={staggerGroup}
                    onChange={(e) => setStaggerGroup(e.target.value)}
                    placeholder="1-4"
                    className="bg-card"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your assigned payment schedule stagger group from HMRC
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HMRC Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle>HMRC MTD Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.hmrcAccessToken ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-400">Connected to HMRC</p>
                  {settings.lastSyncedAt && (
                    <p className="text-sm text-muted-foreground">
                      Last synced: {formatDate(settings.lastSyncedAt)}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnectHmrc}
                disabled={saving}
                className="text-red-400 hover:text-red-500"
              >
                Disconnect from HMRC
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect to HMRC to automatically sync your tax obligations and submit returns via Making Tax Digital.
              </p>

              <Button
                onClick={handleConnectHmrc}
                disabled={!isRegistered}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect to HMRC
              </Button>

              {!isRegistered && (
                <p className="text-xs text-amber-400">
                  Please enable VAT registration first to connect to HMRC
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm">About Making Tax Digital</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Making Tax Digital (MTD) is a requirement for UK businesses. DeepFinance can:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Automatically sync your VAT return obligations from HMRC</li>
            <li>Calculate and submit VAT returns directly to HMRC</li>
            <li>Track submission status and receipts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
