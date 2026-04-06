/**
 * UK Chart of Accounts Templates
 * ================================
 * Pre-built chart of accounts aligned to UK business types.
 * Based on standard UK accounting conventions and HMRC requirements.
 *
 * Account code ranges:
 *   1000–1999: Assets
 *   2000–2999: Liabilities
 *   3000–3999: Equity
 *   4000–4999: Income / Revenue
 *   5000–5999: Direct Costs (Cost of Sales)
 *   6000–6999: Overheads / Administrative Expenses
 *   7000–7999: Depreciation & Amortisation
 *   8000–8999: Other Expenses / Tax
 *   9000–9999: Suspense & Control Accounts
 */

import { AccountType, AccountSubType } from '@deepfinance/shared';

export interface ChartTemplateAccount {
  code: string;
  name: string;
  accountType: AccountType;
  accountSubType: AccountSubType;
  description?: string;
  isBankAccount?: boolean;
  isSystemAccount?: boolean;
}

/**
 * Standard UK Limited Company chart of accounts.
 * Suitable for most SME limited companies.
 */
export const UK_LIMITED_COMPANY: ChartTemplateAccount[] = [
  // ── ASSETS (1000–1999) ────────────────────────────────────
  // Current Assets
  { code: '1001', name: 'Current Account', accountType: AccountType.ASSET, accountSubType: AccountSubType.BANK, description: 'Main business current account', isBankAccount: true },
  { code: '1002', name: 'Savings Account', accountType: AccountType.ASSET, accountSubType: AccountSubType.BANK, description: 'Business savings account', isBankAccount: true },
  { code: '1003', name: 'Petty Cash', accountType: AccountType.ASSET, accountSubType: AccountSubType.BANK, description: 'Petty cash float', isBankAccount: true },
  { code: '1100', name: 'Trade Debtors', accountType: AccountType.ASSET, accountSubType: AccountSubType.ACCOUNTS_RECEIVABLE, description: 'Amounts owed by customers', isSystemAccount: true },
  { code: '1101', name: 'Other Debtors', accountType: AccountType.ASSET, accountSubType: AccountSubType.ACCOUNTS_RECEIVABLE, description: 'Other amounts receivable' },
  { code: '1102', name: 'HMRC — VAT Receivable', accountType: AccountType.ASSET, accountSubType: AccountSubType.ACCOUNTS_RECEIVABLE, description: 'VAT refund due from HMRC' },
  { code: '1103', name: 'HMRC — Corporation Tax Receivable', accountType: AccountType.ASSET, accountSubType: AccountSubType.ACCOUNTS_RECEIVABLE, description: 'CT overpayment due from HMRC' },
  { code: '1200', name: 'Prepayments', accountType: AccountType.ASSET, accountSubType: AccountSubType.PREPAYMENT, description: 'Expenses paid in advance' },
  { code: '1201', name: 'Accrued Income', accountType: AccountType.ASSET, accountSubType: AccountSubType.PREPAYMENT, description: 'Income earned but not yet invoiced' },
  { code: '1300', name: 'Stock / Inventory', accountType: AccountType.ASSET, accountSubType: AccountSubType.INVENTORY, description: 'Goods held for resale' },

  // Fixed Assets
  { code: '1500', name: 'Office Equipment', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Desks, chairs, printers etc.' },
  { code: '1501', name: 'Office Equipment — Accumulated Depreciation', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Accumulated depreciation on office equipment' },
  { code: '1510', name: 'Computer Equipment', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Computers, servers, IT hardware' },
  { code: '1511', name: 'Computer Equipment — Accumulated Depreciation', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Accumulated depreciation on computer equipment' },
  { code: '1520', name: 'Motor Vehicles', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Company vehicles' },
  { code: '1521', name: 'Motor Vehicles — Accumulated Depreciation', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Accumulated depreciation on vehicles' },
  { code: '1530', name: 'Fixtures & Fittings', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Leasehold improvements, fixtures' },
  { code: '1531', name: 'Fixtures & Fittings — Accumulated Depreciation', accountType: AccountType.ASSET, accountSubType: AccountSubType.FIXED_ASSET, description: 'Accumulated depreciation on fixtures' },

  // ── LIABILITIES (2000–2999) ───────────────────────────────
  // Current Liabilities
  { code: '2100', name: 'Trade Creditors', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.ACCOUNTS_PAYABLE, description: 'Amounts owed to suppliers', isSystemAccount: true },
  { code: '2101', name: 'Other Creditors', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.ACCOUNTS_PAYABLE, description: 'Other amounts payable' },
  { code: '2200', name: 'VAT Liability', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.VAT_LIABILITY, description: 'VAT collected less VAT paid — output VAT control', isSystemAccount: true },
  { code: '2201', name: 'VAT Input', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.VAT_LIABILITY, description: 'VAT on purchases (reclaimable)', isSystemAccount: true },
  { code: '2202', name: 'VAT Output', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.VAT_LIABILITY, description: 'VAT on sales (collected)', isSystemAccount: true },
  { code: '2210', name: 'PAYE & NI Liability', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.CURRENT_LIABILITY, description: 'PAYE income tax and NI contributions due to HMRC' },
  { code: '2211', name: 'Pension Liability', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.CURRENT_LIABILITY, description: 'Workplace pension contributions due' },
  { code: '2300', name: 'Corporation Tax Liability', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.CURRENT_LIABILITY, description: 'Corporation tax due to HMRC' },
  { code: '2400', name: 'Accruals', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.ACCRUAL, description: 'Expenses incurred but not yet invoiced' },
  { code: '2401', name: 'Deferred Income', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.ACCRUAL, description: 'Income received but not yet earned' },
  { code: '2500', name: 'Credit Card', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.CURRENT_LIABILITY, description: 'Business credit card balance' },

  // Long-term Liabilities
  { code: '2600', name: 'Bank Loan', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.LONG_TERM_LIABILITY, description: 'Long-term bank borrowing' },
  { code: '2601', name: 'Director Loan Account', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.LONG_TERM_LIABILITY, description: 'Amounts owed to/from directors' },
  { code: '2610', name: 'Hire Purchase Creditor', accountType: AccountType.LIABILITY, accountSubType: AccountSubType.LONG_TERM_LIABILITY, description: 'HP agreements on assets' },

  // ── EQUITY (3000–3999) ────────────────────────────────────
  { code: '3000', name: 'Share Capital', accountType: AccountType.EQUITY, accountSubType: AccountSubType.SHARE_CAPITAL, description: 'Issued share capital', isSystemAccount: true },
  { code: '3001', name: 'Share Premium', accountType: AccountType.EQUITY, accountSubType: AccountSubType.RESERVES, description: 'Premium on shares issued above par value' },
  { code: '3100', name: 'Retained Earnings', accountType: AccountType.EQUITY, accountSubType: AccountSubType.RETAINED_EARNINGS, description: 'Accumulated profits carried forward', isSystemAccount: true },
  { code: '3200', name: 'Dividends Paid', accountType: AccountType.EQUITY, accountSubType: AccountSubType.RETAINED_EARNINGS, description: 'Dividends distributed to shareholders' },

  // ── INCOME (4000–4999) ────────────────────────────────────
  { code: '4000', name: 'Sales Revenue', accountType: AccountType.INCOME, accountSubType: AccountSubType.REVENUE, description: 'Revenue from goods or services sold' },
  { code: '4001', name: 'Service Revenue', accountType: AccountType.INCOME, accountSubType: AccountSubType.REVENUE, description: 'Revenue from services rendered' },
  { code: '4010', name: 'Sales Discounts', accountType: AccountType.INCOME, accountSubType: AccountSubType.REVENUE, description: 'Discounts given to customers' },
  { code: '4100', name: 'Other Income', accountType: AccountType.INCOME, accountSubType: AccountSubType.OTHER_INCOME, description: 'Miscellaneous income' },
  { code: '4200', name: 'Interest Received', accountType: AccountType.INCOME, accountSubType: AccountSubType.OTHER_INCOME, description: 'Bank interest and investment income' },
  { code: '4300', name: 'Rental Income', accountType: AccountType.INCOME, accountSubType: AccountSubType.OTHER_INCOME, description: 'Income from property or equipment rental' },

  // ── DIRECT COSTS (5000–5999) ──────────────────────────────
  { code: '5000', name: 'Cost of Goods Sold', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DIRECT_COST, description: 'Direct cost of goods sold' },
  { code: '5001', name: 'Materials Purchased', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DIRECT_COST, description: 'Raw materials and components' },
  { code: '5010', name: 'Direct Labour', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DIRECT_COST, description: 'Wages directly attributable to production' },
  { code: '5020', name: 'Subcontractor Costs', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DIRECT_COST, description: 'Costs of subcontracted work' },
  { code: '5030', name: 'Shipping & Delivery', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DIRECT_COST, description: 'Carriage and delivery costs on goods sold' },
  { code: '5040', name: 'Purchase Discounts', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DIRECT_COST, description: 'Discounts received from suppliers' },

  // ── OVERHEADS (6000–6999) ─────────────────────────────────
  { code: '6000', name: 'Salaries & Wages', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Staff salaries and wages' },
  { code: '6001', name: 'Employer NI Contributions', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Employer National Insurance' },
  { code: '6002', name: 'Employer Pension Contributions', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Employer pension contributions' },
  { code: '6003', name: 'Staff Training', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Training and development costs' },
  { code: '6004', name: 'Recruitment Costs', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Advertising and agency fees for hiring' },
  { code: '6010', name: 'Rent', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Office or premises rent' },
  { code: '6011', name: 'Rates', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Business rates' },
  { code: '6012', name: 'Light, Heat & Power', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Electricity, gas, water' },
  { code: '6020', name: 'Insurance', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Business insurance premiums' },
  { code: '6030', name: 'Telephone & Internet', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Phone, mobile, broadband costs' },
  { code: '6031', name: 'IT & Software', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Software subscriptions and IT services' },
  { code: '6032', name: 'Postage & Stationery', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Postal costs and office supplies' },
  { code: '6040', name: 'Travel & Subsistence', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Business travel, meals, accommodation' },
  { code: '6041', name: 'Motor Expenses', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Fuel, servicing, road tax for company vehicles' },
  { code: '6042', name: 'Mileage Claims', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Employee mileage reimbursement at HMRC rates' },
  { code: '6050', name: 'Marketing & Advertising', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Advertising, marketing, PR costs' },
  { code: '6051', name: 'Website Costs', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Hosting, domains, web development' },
  { code: '6060', name: 'Professional Fees — Accountancy', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Accounting and bookkeeping fees' },
  { code: '6061', name: 'Professional Fees — Legal', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Legal and solicitor fees' },
  { code: '6062', name: 'Professional Fees — Other', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Consultancy and other professional fees' },
  { code: '6070', name: 'Bank Charges', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Bank fees and transaction charges' },
  { code: '6071', name: 'Interest Paid', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Interest on loans and overdrafts' },
  { code: '6080', name: 'Repairs & Maintenance', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Building and equipment repairs' },
  { code: '6090', name: 'Subscriptions & Memberships', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Professional memberships and trade subscriptions' },
  { code: '6100', name: 'Entertaining', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Client and staff entertaining (note: not tax-deductible for CT)' },
  { code: '6110', name: 'Sundry Expenses', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Miscellaneous business expenses' },
  { code: '6120', name: 'Bad Debts', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Irrecoverable debts written off' },
  { code: '6130', name: 'Charitable Donations', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.OVERHEAD, description: 'Donations to registered charities' },

  // ── DEPRECIATION (7000–7999) ──────────────────────────────
  { code: '7000', name: 'Depreciation — Office Equipment', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DEPRECIATION, description: 'Depreciation charge on office equipment' },
  { code: '7010', name: 'Depreciation — Computer Equipment', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DEPRECIATION, description: 'Depreciation charge on IT equipment' },
  { code: '7020', name: 'Depreciation — Motor Vehicles', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DEPRECIATION, description: 'Depreciation charge on vehicles' },
  { code: '7030', name: 'Depreciation — Fixtures & Fittings', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.DEPRECIATION, description: 'Depreciation charge on fixtures' },

  // ── TAX (8000–8999) ───────────────────────────────────────
  { code: '8000', name: 'Corporation Tax', accountType: AccountType.EXPENSE, accountSubType: AccountSubType.TAX_EXPENSE, description: 'Corporation tax charge for the period' },

  // ── SUSPENSE / CONTROL (9000–9999) ────────────────────────
  { code: '9000', name: 'Suspense Account', accountType: AccountType.ASSET, accountSubType: AccountSubType.CURRENT_ASSET, description: 'Temporary holding account for unallocated transactions' },
  { code: '9100', name: 'Opening Balance Equity', accountType: AccountType.EQUITY, accountSubType: AccountSubType.RETAINED_EARNINGS, description: 'Used during migration for opening balances', isSystemAccount: true },
];

/** Map of available templates */
export const UK_CHART_TEMPLATES: Record<string, { label: string; accounts: ChartTemplateAccount[] }> = {
  LIMITED_COMPANY: {
    label: 'UK Limited Company',
    accounts: UK_LIMITED_COMPANY,
  },
  // Future templates use the same structure — can filter/extend LIMITED_COMPANY
  SOLE_TRADER: {
    label: 'UK Sole Trader',
    accounts: UK_LIMITED_COMPANY.filter(
      (a) =>
        // Sole traders don't need share capital, dividends, or CT accounts
        !['3000', '3001', '3200', '8000', '2300', '1103'].includes(a.code)
    ),
  },
  CIO: {
    label: 'Charitable Incorporated Organisation',
    accounts: UK_LIMITED_COMPANY, // Will be extended by DeepCharity module with fund accounting
  },
};
