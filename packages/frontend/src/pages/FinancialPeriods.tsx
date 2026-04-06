import { useEffect, useState, useCallback } from 'react'
import {
  MoreHorizontal,
  Calendar,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { api, type FinancialPeriod } from '../lib/api'
import { formatDate } from '../lib/utils'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OPEN':
      return <Badge variant="success">{status}</Badge>
    case 'CLOSED':
      return <Badge variant="error">{status}</Badge>
    case 'LOCKED':
      return <Badge variant="warning">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

interface GenerateYearModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (startMonth: number, startYear: number) => Promise<void>
  isLoading: boolean
}

function GenerateYearModal({
  open,
  onOpenChange,
  onGenerate,
  isLoading,
}: GenerateYearModalProps) {
  const [startMonth, setStartMonth] = useState(1)
  const [startYear, setStartYear] = useState(new Date().getFullYear())

  const handleGenerate = async () => {
    await onGenerate(startMonth, startYear)
    onOpenChange(false)
    setStartMonth(1)
    setStartYear(new Date().getFullYear())
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Generate Financial Year</CardTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Month</label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleDateString('en-GB', {
                    month: 'long',
                  })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Start Year</label>
            <Input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="bg-card"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Year'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FinancialPeriods() {
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const loadPeriods = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<FinancialPeriod[]>('/periods')
      setPeriods(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load periods')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  const handleGenerateYear = async (startMonth: number, startYear: number) => {
    try {
      setIsGenerating(true)
      await api.post('/periods/generate', { startMonth, startYear })
      await loadPeriods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate periods')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClosePeriod = async (id: string) => {
    try {
      await api.post(`/periods/${id}/close`, {})
      await loadPeriods()
      setActionMenuId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close period')
    }
  }

  const handleLockPeriod = async (id: string) => {
    try {
      await api.post(`/periods/${id}/lock`, {})
      await loadPeriods()
      setActionMenuId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock period')
    }
  }

  const handleReopenPeriod = async (id: string) => {
    try {
      await api.post(`/periods/${id}/reopen`, {})
      await loadPeriods()
      setActionMenuId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen period')
    }
  }

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActionMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Periods</h1>
          <p className="text-muted-foreground mt-2">
            Manage financial periods and year closure
          </p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Generate Year
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Periods</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading periods...
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No financial periods found.</p>
              <p className="text-sm mt-2">Generate a financial year to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Financial Year</TableHead>
                    <TableHead>Period #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.name}</TableCell>
                      <TableCell>{formatDate(period.startDate)}</TableCell>
                      <TableCell>{formatDate(period.endDate)}</TableCell>
                      <TableCell>{period.financialYear || '-'}</TableCell>
                      <TableCell>{period.periodNumber || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={period.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === period.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? period.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-secondary rounded-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {period.status === 'OPEN' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleClosePeriod(period.id)}
                                >
                                  Close Period
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleLockPeriod(period.id)}
                                >
                                  Lock Period
                                </DropdownMenuItem>
                              </>
                            )}
                            {period.status === 'CLOSED' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleLockPeriod(period.id)}
                                >
                                  Lock Period
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReopenPeriod(period.id)}
                                >
                                  Reopen Period
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <GenerateYearModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        onGenerate={handleGenerateYear}
        isLoading={isGenerating}
      />
    </div>
  )
}
