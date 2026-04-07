import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { type Payslip } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface PayslipDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payslip: Payslip | null
}

export default function PayslipDetailModal({
  open,
  onOpenChange,
  payslip,
}: PayslipDetailModalProps) {
  if (!open || !payslip) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Payslip</CardTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="border-b border-border pb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Employer</p>
                <p className="font-semibold">DeepFinance</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">PAYE Reference</p>
                <p className="font-mono text-sm">123/AB45678</p>
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <h3 className="font-semibold mb-3">Employee</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">
                  {payslip.employee?.firstName} {payslip.employee?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employee Number</p>
                <p className="font-mono text-sm">{payslip.employee?.employeeNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NI Number</p>
                <p className="font-mono text-sm">{payslip.employee?.niNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tax Code</p>
                <p className="font-mono text-sm">{payslip.taxCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NI Category</p>
                <p className="font-mono text-sm">{payslip.niCategory}</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Earnings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Pay</span>
                <span className="font-medium">{formatCurrency(payslip.basicPay)}</span>
              </div>
              {payslip.overtimePay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overtime</span>
                  <span className="font-medium">{formatCurrency(payslip.overtimePay)}</span>
                </div>
              )}
              {payslip.bonusPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus</span>
                  <span className="font-medium">{formatCurrency(payslip.bonusPay)}</span>
                </div>
              )}
              {payslip.commissionPay > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="font-medium">{formatCurrency(payslip.commissionPay)}</span>
                </div>
              )}
              {payslip.otherAdditions > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Additions</span>
                  <span className="font-medium">{formatCurrency(payslip.otherAdditions)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span>Total Gross Pay</span>
                <span>{formatCurrency(payslip.grossPay)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Deductions</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAYE Tax</span>
                <span className="font-medium text-red-400">{formatCurrency(payslip.taxDeducted)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NI Contribution (Employee)</span>
                <span className="font-medium text-red-400">{formatCurrency(payslip.niEmployeeContribution)}</span>
              </div>
              {payslip.studentLoanDeduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student Loan</span>
                  <span className="font-medium text-red-400">{formatCurrency(payslip.studentLoanDeduction)}</span>
                </div>
              )}
              {payslip.pensionEmployeeContribution > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pension (Employee)</span>
                  <span className="font-medium text-red-400">{formatCurrency(payslip.pensionEmployeeContribution)}</span>
                </div>
              )}
              {payslip.otherDeductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Deductions</span>
                  <span className="font-medium text-red-400">{formatCurrency(payslip.otherDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span>Total Deductions</span>
                <span className="text-red-400">
                  {formatCurrency(
                    payslip.taxDeducted +
                    payslip.niEmployeeContribution +
                    payslip.studentLoanDeduction +
                    payslip.pensionEmployeeContribution +
                    payslip.otherDeductions
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-2 border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Pay</span>
                <span className="font-medium">{formatCurrency(payslip.grossPay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deductions</span>
                <span className="font-medium">
                  {formatCurrency(
                    payslip.taxDeducted +
                    payslip.niEmployeeContribution +
                    payslip.studentLoanDeduction +
                    payslip.pensionEmployeeContribution +
                    payslip.otherDeductions
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-emerald-500/30 font-bold text-lg text-emerald-400">
                <span>Net Pay</span>
                <span>{formatCurrency(payslip.netPay)}</span>
              </div>
            </div>
          </div>

          {/* Employer Details */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <h3 className="font-semibold mb-3 text-sm">Employer Contributions (Not deducted)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NI Contribution (Employer)</span>
                <span className="font-medium">{formatCurrency(payslip.niEmployerContribution)}</span>
              </div>
              {payslip.pensionEmployerContribution > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pension (Employer)</span>
                  <span className="font-medium">{formatCurrency(payslip.pensionEmployerContribution)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Year to Date */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm">Year to Date</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cumulative Gross</p>
                <p className="font-medium">{formatCurrency(payslip.cumulativeGrossPay)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cumulative Tax</p>
                <p className="font-medium">{formatCurrency(payslip.cumulativeTaxPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cumulative NI</p>
                <p className="font-medium">{formatCurrency(payslip.cumulativeNiEmployee)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
