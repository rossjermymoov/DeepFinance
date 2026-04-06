import { useEffect, useState, useCallback } from 'react'
import { Plus, MoreHorizontal, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
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
import { api, type TaxRate } from '../lib/api'
import { formatDate } from '../lib/utils'
import CreateTaxRateModal from '../components/tax/CreateTaxRateModal'

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-sm">Active</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
      <span className="text-sm text-muted-foreground">Inactive</span>
    </div>
  )
}

export default function TaxRates() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  const loadTaxRates = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<TaxRate[]>('/tax-rates')
      setTaxRates(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tax rates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTaxRates()
  }, [loadTaxRates])

  const handleEditTaxRate = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate)
    setShowCreateModal(true)
    setActionMenuId(null)
  }

  const handleSetAsDefault = async (id: string) => {
    try {
      await api.patch(`/tax-rates/${id}`, { isDefault: true })
      await loadTaxRates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default tax rate')
    }
    setActionMenuId(null)
  }

  const handleToggleActive = async (taxRate: TaxRate) => {
    try {
      await api.patch(`/tax-rates/${taxRate.id}`, { isActive: !taxRate.isActive })
      await loadTaxRates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tax rate')
    }
    setActionMenuId(null)
  }

  const handleSeedUKDefaults = async () => {
    try {
      setIsSeeding(true)
      await api.post('/tax-rates/seed-uk', {})
      await loadTaxRates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed UK defaults')
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingTaxRate(null)
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
          <h1 className="text-3xl font-bold tracking-tight">Tax Rates</h1>
          <p className="text-muted-foreground mt-2">
            Manage VAT and tax rates
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTaxRate(null)
            setShowCreateModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Tax Rate
        </Button>
      </div>

      {/* Error */}
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

      {/* Tax Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tax rates...
            </div>
          ) : taxRates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tax rates found.</p>
              <p className="text-sm mt-2">Create your first tax rate or seed UK defaults to get started.</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTaxRate(null)
                    setShowCreateModal(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tax Rate
                </Button>
                <Button onClick={handleSeedUKDefaults} disabled={isSeeding}>
                  {isSeeding ? 'Seeding...' : 'Seed UK Defaults'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {taxRates.length > 0 && (
                <div className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeedUKDefaults}
                    disabled={isSeeding}
                  >
                    {isSeeding ? 'Seeding...' : 'Seed UK Defaults'}
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Default?</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Effective To</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">{rate.name}</TableCell>
                        <TableCell className="text-muted-foreground">{rate.code}</TableCell>
                        <TableCell>{rate.rate.toFixed(2)}%</TableCell>
                        <TableCell>
                          {rate.isDefault ? (
                            <Badge variant="success">Default</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ActiveBadge isActive={rate.isActive} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(rate.effectiveFrom)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rate.effectiveTo ? formatDate(rate.effectiveTo) : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu
                            open={actionMenuId === rate.id}
                            onOpenChange={(open) =>
                              setActionMenuId(open ? rate.id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-secondary rounded-md">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditTaxRate(rate)}
                              >
                                Edit
                              </DropdownMenuItem>
                              {!rate.isDefault && (
                                <DropdownMenuItem
                                  onClick={() => handleSetAsDefault(rate.id)}
                                >
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(rate)}
                              >
                                {rate.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaxRateModal
        open={showCreateModal}
        onOpenChange={handleCloseModal}
        onSuccess={() => {
          loadTaxRates()
          handleCloseModal()
        }}
        editingTaxRate={editingTaxRate}
      />
    </div>
  )
}
