import { useEffect, useState } from 'react'
import { X, Check, LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { api, type PayrollSettings } from '../lib/api'
import { formatDate } from '../lib/utils'

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState<PayrollSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [employerName, setEmployerName] = useState('')
  const [employerPayeRef, setEmployerPayeRef] = useState('')
  const [accountsOfficeRef, setAccountsOfficeRef] = useState('')
  const [smallEmployerRelief, setSmallEmployerRelief] = useState(false)
  const [employmentAllowance, setEmploymentAllowance] = useState(false)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await api.get<PayrollSettings>('/payroll/settings')
      setSettings(data)

      // Populate form
      setEmployerName(data.employerName || '')
      setEmployerPayeRef(data.employerPayeRef || '')
      setAccountsOfficeRef(data.accountsOfficeRef || '')
      setSmallEmployerRelief(data.smallEmployerRelief)
      setEmploymentAllowance(data.employmentAllowanceClaimable)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError(null)

      await api.patch('/payroll/settings', {
        employerName: employerName || null,
        employerPayeRef: employerPayeRef || null,
        accountsOfficeRef: accountsOfficeRef || null,
        smallEmployerRelief,
        employmentAllowanceClaimable: employmentAllowance,
      })

      setSuccess('Payroll settings saved successfully')
      await loadSettings()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payroll settings')
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
    if (!confirm('Are you sure you want to disconnect from HMRC? You will need to reconnect to submit RTI returns.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      await api.post('/payroll/settings/disconnect-hmrc', {})
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
        <p className="text-muted-foreground">Loading payroll settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll Settings</h1>
        <p className="text-muted-foreground mt-2">Configure employer details and HMRC RTI connection</p>
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

      {/* Employer Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Employer Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Employer Name
              </label>
              <Input
                type="text"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Your company name"
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground mt-1">
                As registered with HMRC
              </p>
            </div>

            {/* PAYE Ref and AO Ref */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  PAYE Reference
                </label>
                <Input
                  type="text"
                  value={employerPayeRef}
                  onChange={(e) => setEmployerPayeRef(e.target.value.toUpperCase())}
                  placeholder="123/AB45678"
                  className="bg-card font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Found on HMRC correspondence
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Accounts Office Reference
                </label>
                <Input
                  type="text"
                  value={accountsOfficeRef}
                  onChange={(e) => setAccountsOfficeRef(e.target.value.toUpperCase())}
                  placeholder="123/12345678"
                  className="bg-card font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: For PAYE online
                </p>
              </div>
            </div>

            {/* Tax Year Display */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tax Year
              </label>
              <div className="p-3 rounded-md border border-border bg-secondary/30 text-sm font-medium">
                {settings?.taxYear || '2025-26'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current UK tax year
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smallEmployerRelief}
                  onChange={(e) => setSmallEmployerRelief(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border border-border cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-medium">Small Employer Relief</p>
                  <p className="text-sm text-muted-foreground">
                    Apply relief if eligible (must have payroll under £3M)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={employmentAllowance}
                  onChange={(e) => setEmploymentAllowance(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border border-border cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-medium">Employment Allowance</p>
                  <p className="text-sm text-muted-foreground">
                    Claim employment allowance to reduce your NI liability
                  </p>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HMRC RTI Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle>HMRC RTI Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.hmrcAccessToken ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-400">Connected to HMRC</p>
                  {settings.lastRtiSubmissionAt && (
                    <p className="text-sm text-muted-foreground">
                      Last RTI submission: {formatDate(settings.lastRtiSubmissionAt)}
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
                Connect to HMRC to submit payroll information via Real Time Information (RTI). This allows you to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Submit Full Payment Submission (FPS) records</li>
                <li>Manage employment records</li>
                <li>Submit Earnings-based Allowances</li>
              </ul>

              <Button
                onClick={handleConnectHmrc}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect to HMRC
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm">About RTI (Real Time Information)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            RTI is a legal requirement for UK employers. DeepFinance can:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Automatically sync with HMRC via OAuth</li>
            <li>Submit payroll information in real-time</li>
            <li>Track submission receipts and confirmations</li>
            <li>Manage employee start/leaving notifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
