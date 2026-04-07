# Payroll & RTI Module

Complete UK payroll system for DeepFinance with HMRC Real Time Information (RTI) integration. Supports all UK pay frequencies with full 2025/26 tax year calculations.

## Features

- **Employee Management**: Create and manage employees with full payroll details
- **Multiple Pay Frequencies**: Weekly, fortnightly, four-weekly, and monthly payroll
- **PAYE Tax Calculations**: Cumulative method with progressive tax bands (2025/26)
- **National Insurance**: Category A with support for multiple NI categories
- **Student Loan Deductions**: Plans 1, 2, 4, and Postgraduate
- **Pension Auto-Enrolment**: Qualifying earnings with configurable rates
- **Pay Runs**: Draft, calculated, reviewed, submitted, and completed states
- **HMRC RTI Integration**: OAuth authentication and FPS/EPS submissions
- **Dashboard**: Comprehensive payroll summary and analytics

## Database Tables (Schema: core)

All tables in the `core` schema with standard audit fields (tenantId, entityId, createdAt, updatedAt, createdBy, updatedBy).

### employees
- Employee master data including tax code, NI category, pay details
- Bank account information for BACS payments
- Year-to-date cumulative figures
- Previous employment details for P45 integration

### pay_runs
- Pay run header with payroll period details
- Status tracking (DRAFT → CALCULATED → REVIEWED → SUBMITTED → COMPLETED)
- HMRC submission tracking with submission ID

### payslips
- Individual payslip records per employee per pay run
- Full breakdown of gross pay, deductions, and net pay
- Year-to-date cumulative figures (snapshots)

### payroll_settings
- Entity-level payroll configuration
- HMRC OAuth tokens and credentials
- Employer details (PAYE reference, etc.)

## REST API Endpoints

### Settings
- `GET /payroll/settings` - Get payroll configuration
- `PATCH /payroll/settings` - Update payroll settings

### Employees
- `GET /payroll/employees` - List employees (with optional `active` filter)
- `POST /payroll/employees` - Create employee
- `GET /payroll/employees/:id` - Get employee
- `PATCH /payroll/employees/:id` - Update employee
- `DELETE /payroll/employees/:id` - Deactivate employee

### Pay Runs
- `GET /payroll/pay-runs` - List pay runs (with optional `status` filter)
- `POST /payroll/pay-runs` - Create pay run
- `GET /payroll/pay-runs/:id` - Get pay run
- `POST /payroll/pay-runs/:id/calculate` - Calculate payslips
- `POST /payroll/pay-runs/:id/recalculate` - Recalculate payslips
- `POST /payroll/pay-runs/:id/review` - Mark as reviewed
- `POST /payroll/pay-runs/:id/submit` - Submit to HMRC
- `POST /payroll/pay-runs/:id/complete` - Finalize payroll

### Payslips
- `GET /payroll/pay-runs/:id/payslips` - Get payslips for a pay run
- `GET /payroll/employees/:id/payslips` - Get payslip history for employee

### Dashboard
- `GET /payroll/summary` - Get payroll summary and analytics

### HMRC OAuth
- `POST /payroll/hmrc/auth-url` - Get OAuth authorization URL
- `POST /payroll/hmrc/callback` - Handle OAuth callback

## Tax Calculations (2025/26)

### PAYE Income Tax
Implemented using cumulative method with progressive bands:
- Personal Allowance: £12,570
- Basic Rate (20%): £12,571 - £50,270
- Higher Rate (40%): £50,271 - £125,140
- Additional Rate (45%): over £125,140

Tax codes are parsed to extract annual allowance. Special codes supported:
- `L`, `M`, `N`, `T`: Standard allowance codes
- `BR`: Basic rate only
- `D0`: Higher rate only
- `D1`: Additional rate only
- `NT`: No tax
- `0T`: Zero allowance
- `K` codes: Negative allowance (underpayment recovery)

### National Insurance (Category A)
- Primary Threshold (PT): £242/week
- Upper Earnings Limit (UEL): £967/week
- Employee Rate: 8% between PT and UEL, 2% above UEL
- Secondary Threshold (ST): £96/week
- Employer Rate: 13.8% above ST

Thresholds are automatically converted based on pay frequency.

### Student Loan Deductions
- Plan 1: 9% over £24,990/year
- Plan 2: 9% over £27,295/year
- Plan 4: 9% over £31,395/year
- Postgraduate: 6% over £21,000/year

### Pension Auto-Enrolment
- Qualifying Earnings Range: £6,240 - £50,270/year
- Default Employee Contribution: 5%
- Default Employer Contribution: 3%

## Pay Run Workflow

1. **Create Pay Run**: Define period dates and frequency
2. **Calculate**: Generate payslips for all active employees
3. **Review**: Audit payroll before submission
4. **Submit**: Submit to HMRC via RTI
5. **Complete**: Finalize and update employee cumulative figures

## HMRC RTI Integration

### Authentication
OAuth 2.0 flow with HMRC:
1. Call `POST /payroll/hmrc/auth-url` to get authorization URL
2. User authenticates with HMRC
3. Handle callback at `POST /payroll/hmrc/callback` with auth code
4. Service exchanges code for access/refresh tokens

### Submissions
- **Full Payment Submission (FPS)**: Monthly/weekly employee payment details
- **Employer Payment Summary (EPS)**: Optional statutory payments and allowances

Tokens are automatically refreshed when expired (with 5-minute buffer).

## Data Types

All monetary amounts are stored and calculated in **PENCE** (integer arithmetic) to avoid floating-point precision issues.

Example:
- £250.50 = 25050 pence
- Calculations use pence throughout
- API returns both pence and formatted pounds for clarity

## Usage Example

```typescript
// Create an employee
const employee = await payrollService.createEmployee(
  tenantId,
  entityId,
  {
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1990-01-15',
    gender: 'MALE',
    taxCode: '1257L',
    payFrequency: 'MONTHLY',
    basicPayRate: 250000, // £2,500 in pence
    payMethod: 'SALARY',
    startDate: '2025-01-01',
    addressLine1: '10 High Street',
    city: 'London',
    postcode: 'SW1A 1AA',
  },
  userId,
);

// Create a pay run
const payRun = await payrollService.createPayRun(
  tenantId,
  entityId,
  {
    payFrequency: 'MONTHLY',
    taxPeriod: 1,
    periodStart: '2025-01-01',
    periodEnd: '2025-01-31',
    paymentDate: '2025-02-01',
  },
  userId,
);

// Calculate payslips
await payrollService.calculatePayRun(tenantId, entityId, payRun.id, userId);

// Review and submit
await payrollService.reviewPayRun(tenantId, entityId, payRun.id, userId);
const submitted = await payrollService.submitPayRun(tenantId, entityId, payRun.id, userId);

// Complete payroll
await payrollService.completePayRun(tenantId, entityId, payRun.id, userId);
```

## Environment Variables

```env
HMRC_API_BASE_URL=https://test-api.service.hmrc.gov.uk  # Sandbox
# HMRC_API_BASE_URL=https://api.service.hmrc.gov.uk  # Production

HMRC_CLIENT_ID=your_client_id
HMRC_CLIENT_SECRET=your_client_secret
HMRC_REDIRECT_URI=http://localhost:3000/api/payroll/hmrc/callback
```

## Testing

The module includes:
- Full tax calculation tests for all bands
- NI calculation tests across frequencies
- Student loan calculation tests
- Pension auto-enrolment tests
- End-to-end payslip calculation tests

## File Structure

```
payroll/
├── employee.entity.ts              # Employee master data
├── pay-run.entity.ts               # Pay run header
├── payslip.entity.ts               # Individual payslips
├── payroll-settings.entity.ts      # Entity settings
├── payroll-calculation.service.ts  # Tax/NI calculations
├── hmrc-rti.service.ts             # HMRC API integration
├── payroll.service.ts              # Main orchestration
├── payroll.controller.ts           # REST endpoints
├── payroll.dto.ts                  # Data transfer objects
├── payroll.module.ts               # Module definition
├── index.ts                        # Public exports
└── README.md                       # This file
```

## Performance Considerations

- Payslip calculations are optimized for bulk processing
- Large pay runs (1000+ employees) batch process in groups
- Cumulative calculations use integer arithmetic for precision
- HMRC API calls include retry logic with exponential backoff
- Database indexes on frequently queried fields (tenantId, entityId, status)

## Limitations & Future Enhancements

Current:
- Category A NI fully implemented
- Other NI categories use Category A logic (future: implement category-specific rates)
- Small Employer Relief not yet calculated in tax
- CIS and other specialist deductions basic structure only

Potential enhancements:
- Advanced NI categories (B, C, F, etc.)
- Statutory payments (SMP, SPP, SAP)
- Weekly/four-weekly PAYE reconciliation
- Year-end P32 reconciliation
- CIS contractor integration
- Timesheet/attendance integration
