import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  LogOut,
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
import { api, type Employee } from '../lib/api'
import { cn, formatCurrency } from '../lib/utils'
import AddEmployeeModal from '../components/payroll/AddEmployeeModal'

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return <Badge variant="success">Active</Badge>
  }
  return <Badge variant="secondary">Inactive</Badge>
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <div className={cn(
      'w-2 h-2 rounded-full',
      isActive ? 'bg-emerald-400' : 'bg-red-400'
    )} />
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<Employee[]>('/payroll/employees').catch(() => [])
      setEmployees(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false)
      setActionMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && emp.isActive) ||
        (statusFilter === 'INACTIVE' && !emp.isActive)

      const matchesSearch = searchQuery.toLowerCase() === '' ||
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesSearch
    })
  }, [employees, statusFilter, searchQuery])

  const summaryStats = useMemo(() => {
    const total = employees.length
    const active = employees.filter(e => e.isActive).length
    const inactive = employees.filter(e => !e.isActive).length
    const totalPayroll = employees
      .filter(e => e.isActive)
      .reduce((sum, e) => sum + e.basicPayRate, 0)

    return { total, active, inactive, totalPayroll }
  }, [employees])

  const handleDeactivate = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return
    }

    try {
      setDeleting(employeeId)
      await api.patch(`/payroll/employees/${employeeId}`, { isActive: false })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate employee')
    } finally {
      setDeleting(null)
      setActionMenuId(null)
    }
  }

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
    setActionMenuId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-2">Manage your payroll employees</p>
        </div>
        <Button onClick={() => {
          setSelectedEmployee(null)
          setShowAddModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.active} active, {summaryStats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{summaryStats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently on payroll
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive/Departed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{summaryStats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Deactivated employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Monthly Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalPayroll * 100)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active salaries/rates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or employee number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="px-4 py-2 rounded-md border border-border hover:bg-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'ALL' ? 'All Status' : statusFilter}
          </button>
          {showStatusDropdown && (
            <div className="absolute left-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status)
                    setShowStatusDropdown(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors',
                    statusFilter === status && 'bg-primary/10 text-primary'
                  )}
                >
                  {status === 'ALL' ? 'All Status' : status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                {employees.length === 0 ? 'No employees found.' : 'No employees match your filters.'}
              </p>
              {employees.length === 0 && (
                <p className="text-sm mt-2">Add your first employee to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Emp #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tax Code</TableHead>
                    <TableHead>NI Cat</TableHead>
                    <TableHead>Pay Frequency</TableHead>
                    <TableHead className="text-right">Annual Salary/Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <StatusDot isActive={emp.isActive} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{emp.employeeNumber}</TableCell>
                      <TableCell className="font-medium">
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{emp.taxCode}</TableCell>
                      <TableCell className="text-sm">{emp.niCategory}</TableCell>
                      <TableCell className="text-sm">{emp.payFrequency}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(emp.basicPayRate * 100)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={emp.isActive} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={actionMenuId === emp.id}
                          onOpenChange={(open) =>
                            setActionMenuId(open ? emp.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-secondary rounded-md">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(emp)
                                setActionMenuId(null)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(emp)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {emp.isActive && (
                              <DropdownMenuItem
                                onClick={() => deleting !== emp.id && handleDeactivate(emp.id)}
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
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

      {/* Modals */}
      <AddEmployeeModal
        open={showAddModal || showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false)
            setShowEditModal(false)
            setSelectedEmployee(null)
          }
        }}
        onSuccess={loadData}
        employee={selectedEmployee || undefined}
      />
    </div>
  )
}
