import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ChartOfAccounts from './pages/ChartOfAccounts'
import JournalEntries from './pages/JournalEntries'
import FinancialPeriods from './pages/FinancialPeriods'
import Reports from './pages/Reports'
import Contacts from './pages/Contacts'
import Invoices from './pages/Invoices'
import Bills from './pages/Bills'
import TaxRates from './pages/TaxRates'
import BankReconciliation from './pages/BankReconciliation'
import VatReturns from './pages/VatReturns'
import VatSettings from './pages/VatSettings'
import Employees from './pages/Employees'
import PayRuns from './pages/PayRuns'
import PayrollSettings from './pages/PayrollSettings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<ChartOfAccounts />} />
        <Route path="/journals" element={<JournalEntries />} />
        <Route path="/periods" element={<FinancialPeriods />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/tax-rates" element={<TaxRates />} />
        <Route path="/bank" element={<BankReconciliation />} />
        <Route path="/vat" element={<VatReturns />} />
        <Route path="/vat/settings" element={<VatSettings />} />
        <Route path="/payroll/employees" element={<Employees />} />
        <Route path="/payroll/pay-runs" element={<PayRuns />} />
        <Route path="/payroll/settings" element={<PayrollSettings />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
        <Route path="*" element={<Placeholder title="Page Not Found" />} />
      </Route>
    </Routes>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">This page is coming soon.</p>
      </div>
    </div>
  )
}
