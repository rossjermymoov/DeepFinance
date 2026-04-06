import { useState, useEffect } from 'react'
import { X, FileSpreadsheet, Check, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

interface Template {
  id: string
  label: string
  accountCount: number
}

interface SeedResult {
  created: number
  skipped: number
  errors: string[]
}

interface SeedTemplateModalProps {
  onClose: () => void
  onSeeded: () => void
}

export default function SeedTemplateModal({ onClose, onSeeded }: SeedTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await api.get<Template[]>('/accounts/templates')
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  async function handleSeed() {
    if (!selectedTemplate) return
    setSeeding(true)
    setError(null)
    try {
      const res = await api.post<SeedResult>(`/accounts/seed/${selectedTemplate}`, {})
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed accounts')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <Card className="relative z-10 w-full max-w-md mx-4 bg-card border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Load UK Template
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-6">
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <p className="font-medium text-green-400">Template loaded</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.created} accounts created, {result.skipped} skipped (already existed).
                </p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-amber-400 mt-1">
                    {result.errors.length} error(s) — check console for details.
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={onSeeded}>Done</Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a pre-built UK chart of accounts template. This will create the standard
                accounts for your entity type. You can customise them afterwards.
              </p>

              <div className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-md border transition-colors',
                      selectedTemplate === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40'
                    )}
                  >
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.accountCount} accounts
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSeed} disabled={!selectedTemplate || seeding}>
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load Template'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
