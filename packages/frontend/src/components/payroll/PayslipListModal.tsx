import { useState, useEffect } from 'react'
import { X, Eye, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { api, type PayRun, type Payslip } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import PayslipDetailModal from './PayslipDetailModal'

interface PayslipListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payRun: PayRun | null
}

export default function PayslipListModal({
  open,
  onOpenChange,
  payRun,
}: PayslipListModalProps) {
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    if (open && payRun) {
      loadPayslips()
    }
  }, [open, payRun])

  const loadPayslips = async () => {
    if (!payRun) return
    try {
      setLoading(true)
      const data = await api.get<Payslip[]>(`/payroll/pay-runs/${payRun.id}/payslips`)
      setPayslips(data || [])
    } catch (err) {
      console.error('Failed to load payslips:', err)
    } finally {
      setLoading(false)
    }
  }

  const totals = {
    grossPay: payslips.reduce((sum, p) => sum + p.grossPay, 0),
    taxDeducted: payslips.reduce((sum, p) => sum + p.taxDeducted, 0),
    niEmployee: payslips.reduce((sum, p) => sum + p.niEmployeeContribution, 0),
    niEmployer: payslips.reduce((sum, p) => sum + p.niEmployerContribution, 0),
    studentLoan: payslips.reduce((sum, p) => sum + p.studentLoanDeduction, 0),
    pensionEmployee: payslips.reduce((sum, p) => sum + p.pensionEmployeeContribution, 0),
    netPay: payslips.reduce((sum, p) => sum + p.netPay, 0),
  }

  if (!open || !payRun) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <Card className="w-full max-w-4xl m-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Payslips - {payRun.payRunNumber}</CardTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading payslips...
              </div>
            ) : payslips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No payslips found for this pay run.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Payslips Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Gross Pay</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">NI (Ee)</TableHead>
                        <TableHead className="text-right">NI (Er)</TableHead>
                        <TableHead className="text-right">Loan</TableHead>
                        <TableHead className="text-right">Pension (Ee)</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslips.map((payslip) => (
                        <TableRow key={payslip.id}>
                          <TableCell className="font-medium">
                            {payslip.employee?.firstName} {payslip.employee?.lastName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payslip.grossPay)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payslip.taxDeducted)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payslip.niEmployeeContribution)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(payslip.niEmployerContribution)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payslip.studentLoanDeduction)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payslip.pensionEmployeeContribution)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-400">
                            {formatCurrency(payslip.netPay)}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => {
                                setSelectedPayslip(payslip)
                                setShowDetailModal(true)
                              }}
                              className="p-2 hover:bg-secondary rounded-md"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-secondary/30 font-bold border-t-2">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.grossPay)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.taxDeducted)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.niEmployee)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(totals.niEmployer)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.studentLoan)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.pensionEmployee)}</TableCell>
                        <TableCell className="text-right text-emerald-400">{formatCurrency(totals.netPay)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    disabled
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export (Coming Soon)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <PayslipDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        payslip={selectedPayslip}
      />
    </>
  )
}
