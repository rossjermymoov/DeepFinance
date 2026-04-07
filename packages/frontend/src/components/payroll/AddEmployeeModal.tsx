import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { api, type Employee } from '../../lib/api'

interface AddEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  employee?: Employee
}

export default function AddEmployeeModal({
  open,
  onOpenChange,
  onSuccess,
  employee,
}: AddEmployeeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Personal Details
  const [title, setTitle] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE')
  const [niNumber, setNiNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Address
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [county, setCounty] = useState('')
  const [postcode, setPostcode] = useState('')

  // Employment
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [startDate, setStartDate] = useState('')
  const [isDirector, setIsDirector] = useState(false)

  // Pay Details
  const [payMethod, setPayMethod] = useState<'SALARY' | 'HOURLY'>('SALARY')
  const [basicPayRate, setBasicPayRate] = useState('')
  const [payFrequency, setPayFrequency] = useState<'WEEKLY' | 'FORTNIGHTLY' | 'FOUR_WEEKLY' | 'MONTHLY'>('MONTHLY')

  // Tax & NI
  const [taxCode, setTaxCode] = useState('1257L')
  const [niCategory, setNiCategory] = useState('A')
  const [studentLoanPlan, setStudentLoanPlan] = useState<'NONE' | 'PLAN_1' | 'PLAN_2' | 'PLAN_4' | 'POSTGRAD'>('NONE')

  // Pension
  const [pensionOptOut, setPensionOptOut] = useState(false)
  const [pensionContributionPct, setPensionContributionPct] = useState('5')
  const [employerPensionPct, setEmployerPensionPct] = useState('3')

  // Bank Details
  const [sortCode, setSortCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  // P45 Previous Employment
  const [previousEmploymentPay, setPreviousEmploymentPay] = useState('')
  const [previousEmploymentTax, setPreviousEmploymentTax] = useState('')

  useEffect(() => {
    if (employee) {
      setTitle(employee.title || '')
      setFirstName(employee.firstName)
      setMiddleName(employee.middleName || '')
      setLastName(employee.lastName)
      setDateOfBirth(employee.dateOfBirth)
      setGender(employee.gender)
      setNiNumber(employee.niNumber || '')
      setEmail(employee.email || '')
      setPhone(employee.phone || '')
      setAddressLine1(employee.addressLine1 || '')
      setAddressLine2(employee.addressLine2 || '')
      setCity(employee.city || '')
      setCounty(employee.county || '')
      setPostcode(employee.postcode || '')
      setEmployeeNumber(employee.employeeNumber)
      setStartDate(employee.startDate)
      setIsDirector(employee.isDirector)
      setPayMethod(employee.payMethod)
      setBasicPayRate((employee.basicPayRate / 100).toString())
      setPayFrequency(employee.payFrequency)
      setTaxCode(employee.taxCode)
      setNiCategory(employee.niCategory)
      setStudentLoanPlan(employee.studentLoanPlan)
      setPensionOptOut(employee.pensionOptOut)
      setPensionContributionPct(employee.pensionContributionPct.toString())
      setEmployerPensionPct(employee.employerPensionPct.toString())
      setSortCode(employee.bankSortCode || '')
      setAccountNumber(employee.bankAccountNumber || '')
      setAccountName(employee.bankAccountName || '')
      setPreviousEmploymentPay((employee.previousEmploymentPay / 100).toString())
      setPreviousEmploymentTax((employee.previousEmploymentTax / 100).toString())
    }
  }, [employee, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !lastName || !startDate || !basicPayRate) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload = {
        title: title || null,
        firstName,
        middleName: middleName || null,
        lastName,
        dateOfBirth,
        gender,
        niNumber: niNumber || null,
        email: email || null,
        phone: phone || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        county: county || null,
        postcode: postcode || null,
        employeeNumber: employeeNumber || undefined,
        startDate,
        isDirector,
        payMethod,
        basicPayRate: Math.round(parseFloat(basicPayRate) * 100),
        payFrequency,
        taxCode,
        niCategory,
        studentLoanPlan,
        pensionOptOut,
        pensionContributionPct: parseFloat(pensionContributionPct),
        employerPensionPct: parseFloat(employerPensionPct),
        bankSortCode: sortCode || null,
        bankAccountNumber: accountNumber || null,
        bankAccountName: accountName || null,
        previousEmploymentPay: previousEmploymentPay ? Math.round(parseFloat(previousEmploymentPay) * 100) : 0,
        previousEmploymentTax: previousEmploymentTax ? Math.round(parseFloat(previousEmploymentTax) * 100) : 0,
      }

      if (employee) {
        await api.patch(`/payroll/employees/${employee.id}`, payload)
      } else {
        await api.post('/payroll/employees', payload)
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{employee ? 'Edit Employee' : 'Add Employee'}</CardTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Personal Details Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Personal Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-2 rounded-md border border-border bg-card text-sm"
                  >
                    <option value="">Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                  </select>
                  <Input
                    type="text"
                    placeholder="First Name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="text"
                    placeholder="Middle Name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="text"
                    placeholder="Last Name *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="date"
                    placeholder="Date of Birth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="bg-card"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                    className="px-3 py-2 rounded-md border border-border bg-card text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                  <Input
                    type="text"
                    placeholder="NI Number"
                    value={niNumber}
                    onChange={(e) => setNiNumber(e.target.value.toUpperCase())}
                    className="bg-card font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Address</h3>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Address Line 1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="bg-card"
                />
                <Input
                  type="text"
                  placeholder="Address Line 2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="bg-card"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="text"
                    placeholder="County"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="text"
                    placeholder="Postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            </div>

            {/* Employment Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Employment</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    placeholder="Employee Number"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="date"
                    placeholder="Start Date *"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-card"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-secondary/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDirector}
                      onChange={(e) => setIsDirector(e.target.checked)}
                      className="w-4 h-4 rounded border border-border"
                    />
                    <span className="text-sm">Director</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Pay Details Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Pay Details</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as 'SALARY' | 'HOURLY')}
                    className="px-3 py-2 rounded-md border border-border bg-card text-sm"
                  >
                    <option value="SALARY">Salary</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Basic Pay Rate *"
                    value={basicPayRate}
                    onChange={(e) => setBasicPayRate(e.target.value)}
                    className="bg-card"
                  />
                  <select
                    value={payFrequency}
                    onChange={(e) => setPayFrequency(e.target.value as any)}
                    className="px-3 py-2 rounded-md border border-border bg-card text-sm"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="FORTNIGHTLY">Fortnightly</option>
                    <option value="FOUR_WEEKLY">Four-Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tax & NI Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Tax & NI</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    placeholder="Tax Code"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                    className="bg-card font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="NI Category"
                    value={niCategory}
                    onChange={(e) => setNiCategory(e.target.value.toUpperCase())}
                    className="bg-card font-mono"
                  />
                  <select
                    value={studentLoanPlan}
                    onChange={(e) => setStudentLoanPlan(e.target.value as any)}
                    className="px-3 py-2 rounded-md border border-border bg-card text-sm"
                  >
                    <option value="NONE">No Student Loan</option>
                    <option value="PLAN_1">Plan 1</option>
                    <option value="PLAN_2">Plan 2</option>
                    <option value="PLAN_4">Plan 4</option>
                    <option value="POSTGRAD">Postgrad</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pension Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Pension</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-secondary/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pensionOptOut}
                    onChange={(e) => setPensionOptOut(e.target.checked)}
                    className="w-4 h-4 rounded border border-border"
                  />
                  <span className="text-sm">Opted out of pension</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Employee Contribution %"
                    value={pensionContributionPct}
                    onChange={(e) => setPensionContributionPct(e.target.value)}
                    className="bg-card"
                    disabled={pensionOptOut}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Employer Contribution %"
                    value={employerPensionPct}
                    onChange={(e) => setEmployerPensionPct(e.target.value)}
                    className="bg-card"
                    disabled={pensionOptOut}
                  />
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Bank Details</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="text"
                    placeholder="Sort Code"
                    value={sortCode}
                    onChange={(e) => setSortCode(e.target.value)}
                    className="bg-card font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-card font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="Account Name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            </div>

            {/* P45 Previous Employment */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">P45 / Previous Employment (Optional)</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Previous Pay"
                    value={previousEmploymentPay}
                    onChange={(e) => setPreviousEmploymentPay(e.target.value)}
                    className="bg-card"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Previous Tax"
                    value={previousEmploymentTax}
                    onChange={(e) => setPreviousEmploymentTax(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Employee'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
