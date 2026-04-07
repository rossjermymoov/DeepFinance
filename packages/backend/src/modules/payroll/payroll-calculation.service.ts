import { Injectable, BadRequestException } from '@nestjs/common';
import { Employee, PayFrequency, PayMethod, StudentLoanPlan, NiCategory } from './employee.entity';
import { PayRun } from './pay-run.entity';

export interface PayslipCalculation {
  basicPay: number;
  overtimePay: number;
  bonusPay: number;
  commissionPay: number;
  grossPay: number;
  taxableGross: number;
  taxDeducted: number;
  niEmployeeContribution: number;
  niEmployerContribution: number;
  niablePay: number;
  studentLoanDeduction: number;
  pensionEmployeeContribution: number;
  pensionEmployerContribution: number;
  otherDeductions: number;
  otherAdditions: number;
  netPay: number;
  cumulativeGrossPay: number;
  cumulativeTaxPaid: number;
  cumulativeNiEmployee: number;
}

export interface TaxCalculation {
  taxDue: number;
  cumulativeGross: number;
  cumulativeTax: number;
}

export interface NiCalculation {
  employeeNi: number;
  employerNi: number;
  niablePay: number;
}

export interface PensionCalculation {
  employeeContribution: number;
  employerContribution: number;
}

/**
 * UK Payroll calculation service for 2025/26 tax year.
 * Implements PAYE, NI, Student Loan, and Pension calculations.
 * All amounts in PENCE (integer arithmetic).
 */
@Injectable()
export class PayrollCalculationService {
  // 2025/26 Tax year thresholds (in PENCE)
  private readonly PERSONAL_ALLOWANCE = 1257000; // £12,570
  private readonly BASIC_RATE_START = 1257100; // £12,571
  private readonly BASIC_RATE_END = 5027000; // £50,270
  private readonly HIGHER_RATE_START = 5027100; // £50,271
  private readonly HIGHER_RATE_END = 12514000; // £125,140
  private readonly ADDITIONAL_RATE_START = 12514100; // over £125,140

  // National Insurance thresholds (weekly, in PENCE)
  private readonly NI_WEEKLY_PT = 24200; // £242
  private readonly NI_WEEKLY_UEL = 96700; // £967
  private readonly NI_WEEKLY_ST = 9600; // £96

  // Student Loan thresholds (annual, in PENCE)
  private readonly STUDENT_LOAN_PLAN1_THRESHOLD = 2499000; // £24,990
  private readonly STUDENT_LOAN_PLAN2_THRESHOLD = 2729500; // £27,295
  private readonly STUDENT_LOAN_PLAN4_THRESHOLD = 3139500; // £31,395
  private readonly STUDENT_LOAN_POSTGRAD_THRESHOLD = 2100000; // £21,000

  // Pension qualifying earnings (annual, in PENCE)
  private readonly PENSION_LOWER_THRESHOLD = 624000; // £6,240
  private readonly PENSION_UPPER_THRESHOLD = 5027000; // £50,270

  /**
   * Parse tax code and return annual allowance in pence.
   * Handles L, M, N, T, BR, D0, D1, NT, 0T, K codes.
   */
  parseTaxCode(taxCode: string): number {
    if (!taxCode || taxCode.length === 0) {
      return 0;
    }

    const code = taxCode.toUpperCase().trim();

    // Special codes with no allowance
    if (code === 'BR' || code === 'D0' || code === 'D1' || code === 'NT' || code === '0T') {
      return 0;
    }

    // Parse numeric part
    const numMatch = code.match(/^(\d+)/);
    if (!numMatch) {
      return 0;
    }

    const numericPart = parseInt(numMatch[1], 10);
    let allowance = (numericPart * 10 + 9) * 100; // Convert to pence

    // Get suffix
    const suffix = code.slice(numMatch[1].length);

    // K codes have negative allowance (underpayment recovery)
    if (suffix === 'K') {
      allowance = -allowance;
    }

    // L, M, N, T codes have standard positive allowance
    return allowance;
  }

  /**
   * Determine tax rate type from tax code.
   * Returns: 'standard' (personal allowance), 'br' (basic rate only),
   * 'd0' (higher rate only), 'd1' (additional rate only), 'nt' (no tax)
   */
  getTaxCodeType(taxCode: string): string {
    if (!taxCode || taxCode.length === 0) {
      return 'standard';
    }

    const code = taxCode.toUpperCase().trim();

    if (code === 'BR') return 'br';
    if (code === 'D0') return 'd0';
    if (code === 'D1') return 'd1';
    if (code === 'NT') return 'nt';
    if (code === '0T') return 'standard'; // 0T means zero allowance but use standard rates

    return 'standard';
  }

  /**
   * Get period factor based on frequency.
   */
  private getPeriodFactor(frequency: PayFrequency): number {
    switch (frequency) {
      case PayFrequency.WEEKLY:
        return 52;
      case PayFrequency.FORTNIGHTLY:
        return 26;
      case PayFrequency.FOUR_WEEKLY:
        return 13;
      case PayFrequency.MONTHLY:
        return 12;
      default:
        throw new BadRequestException(`Unknown frequency: ${frequency}`);
    }
  }

  /**
   * Calculate PAYE income tax using cumulative method.
   * All amounts in PENCE.
   */
  calculatePaye(
    taxCode: string,
    grossPay: number,
    cumulativeGross: number,
    cumulativeTax: number,
    period: number,
    frequency: PayFrequency,
  ): TaxCalculation {
    const periodFactor = this.getPeriodFactor(frequency);
    const codeType = this.getTaxCodeType(taxCode);

    // Cumulative gross including this period
    const newCumulativeGross = Math.round(cumulativeGross + grossPay);

    // Calculate tax on cumulative gross
    let taxDueOnCumulative = 0;
    const allowance = this.parseTaxCode(taxCode);
    const periodAllowance = Math.round(allowance / periodFactor);

    if (codeType === 'nt') {
      // No tax
      taxDueOnCumulative = 0;
    } else if (codeType === 'br') {
      // Basic rate only (20%)
      const taxableIncome = Math.max(0, newCumulativeGross - periodAllowance);
      taxDueOnCumulative = Math.round(taxableIncome * 0.2);
    } else if (codeType === 'd0') {
      // Higher rate only (40%)
      const taxableIncome = Math.max(0, newCumulativeGross - periodAllowance);
      taxDueOnCumulative = Math.round(taxableIncome * 0.4);
    } else if (codeType === 'd1') {
      // Additional rate only (45%)
      const taxableIncome = Math.max(0, newCumulativeGross - periodAllowance);
      taxDueOnCumulative = Math.round(taxableIncome * 0.45);
    } else {
      // Standard progressive bands
      const taxableIncome = Math.max(0, newCumulativeGross - periodAllowance);
      taxDueOnCumulative = this.calculateProgressiveTax(taxableIncome);
    }

    // Tax for this period = cumulative tax due - tax already paid
    const taxDueThisPeriod = Math.max(0, taxDueOnCumulative - cumulativeTax);
    const newCumulativeTax = Math.round(cumulativeTax + taxDueThisPeriod);

    return {
      taxDue: taxDueThisPeriod,
      cumulativeGross: newCumulativeGross,
      cumulativeTax: newCumulativeTax,
    };
  }

  /**
   * Calculate progressive tax across all bands.
   */
  private calculateProgressiveTax(taxableIncome: number): number {
    let tax = 0;

    // Basic rate: 20% on £12,571 to £50,270
    const basicRateIncome = Math.min(
      Math.max(0, taxableIncome - this.BASIC_RATE_START),
      this.BASIC_RATE_END - this.BASIC_RATE_START + 1,
    );
    tax += Math.round(basicRateIncome * 0.2);

    // Higher rate: 40% on £50,271 to £125,140
    const higherRateIncome = Math.min(
      Math.max(0, taxableIncome - this.HIGHER_RATE_START),
      this.HIGHER_RATE_END - this.HIGHER_RATE_START + 1,
    );
    tax += Math.round(higherRateIncome * 0.4);

    // Additional rate: 45% over £125,140
    const additionalRateIncome = Math.max(0, taxableIncome - this.ADDITIONAL_RATE_START);
    tax += Math.round(additionalRateIncome * 0.45);

    return tax;
  }

  /**
   * Calculate National Insurance contributions.
   * Category A is default. All amounts in PENCE.
   */
  calculateNI(
    niCategory: string,
    grossPay: number,
    frequency: PayFrequency,
  ): NiCalculation {
    const periodFactor = this.getPeriodFactor(frequency);

    // Convert weekly thresholds to period thresholds
    const pt = Math.round((this.NI_WEEKLY_PT / 52) * periodFactor);
    const uel = Math.round((this.NI_WEEKLY_UEL / 52) * periodFactor);
    const st = Math.round((this.NI_WEEKLY_ST / 52) * periodFactor);

    let employeeNi = 0;
    let employerNi = 0;

    // Category A (default)
    if (niCategory === NiCategory.A || niCategory === 'A') {
      // Employee NI
      if (grossPay > pt) {
        const niableUpToUel = Math.min(grossPay, uel) - pt;
        const niableAboveUel = Math.max(0, grossPay - uel);
        employeeNi = Math.round(niableUpToUel * 0.08 + niableAboveUel * 0.02);
      }

      // Employer NI (no upper limit)
      if (grossPay > st) {
        const niableAmount = grossPay - st;
        employerNi = Math.round(niableAmount * 0.138);
      }
    } else {
      // For other categories, assume similar structure or zero
      // Category B, C, F, H, I, J, L, M, S, V, Z have different rates
      // For now, implement Category A as default for others
      if (grossPay > pt) {
        const niableUpToUel = Math.min(grossPay, uel) - pt;
        const niableAboveUel = Math.max(0, grossPay - uel);
        employeeNi = Math.round(niableUpToUel * 0.08 + niableAboveUel * 0.02);
      }

      if (grossPay > st) {
        const niableAmount = grossPay - st;
        employerNi = Math.round(niableAmount * 0.138);
      }
    }

    return {
      employeeNi,
      employerNi,
      niablePay: Math.max(0, grossPay - pt),
    };
  }

  /**
   * Calculate student loan deduction.
   * All amounts in PENCE.
   */
  calculateStudentLoan(
    plan: StudentLoanPlan | string,
    grossPay: number,
    frequency: PayFrequency,
  ): number {
    if (plan === StudentLoanPlan.NONE || plan === 'NONE') {
      return 0;
    }

    const periodFactor = this.getPeriodFactor(frequency);
    let threshold = 0;
    let rate = 0.09; // 9% for most plans

    switch (plan) {
      case StudentLoanPlan.PLAN_1:
      case 'PLAN_1':
        threshold = Math.round(this.STUDENT_LOAN_PLAN1_THRESHOLD / periodFactor);
        break;
      case StudentLoanPlan.PLAN_2:
      case 'PLAN_2':
        threshold = Math.round(this.STUDENT_LOAN_PLAN2_THRESHOLD / periodFactor);
        break;
      case StudentLoanPlan.PLAN_4:
      case 'PLAN_4':
        threshold = Math.round(this.STUDENT_LOAN_PLAN4_THRESHOLD / periodFactor);
        break;
      case StudentLoanPlan.POSTGRAD:
      case 'POSTGRAD':
        threshold = Math.round(this.STUDENT_LOAN_POSTGRAD_THRESHOLD / periodFactor);
        rate = 0.06; // 6% for postgraduate
        break;
      default:
        return 0;
    }

    if (grossPay > threshold) {
      const deductible = grossPay - threshold;
      return Math.round(deductible * rate);
    }

    return 0;
  }

  /**
   * Calculate pension auto-enrolment contributions.
   * All amounts in PENCE.
   */
  calculatePension(
    grossPay: number,
    employeePct: number,
    employerPct: number,
    frequency: PayFrequency,
  ): PensionCalculation {
    const periodFactor = this.getPeriodFactor(frequency);

    // Convert annual thresholds to period thresholds
    const lower = Math.round(this.PENSION_LOWER_THRESHOLD / periodFactor);
    const upper = Math.round(this.PENSION_UPPER_THRESHOLD / periodFactor);

    let employeeContribution = 0;
    let employerContribution = 0;

    if (grossPay >= lower) {
      // Calculate qualifying earnings
      const qualifyingEarnings = Math.min(grossPay, upper);
      const pensionableEarnings = qualifyingEarnings - lower;

      employeeContribution = Math.round(pensionableEarnings * (employeePct / 100));
      employerContribution = Math.round(pensionableEarnings * (employerPct / 100));
    }

    return {
      employeeContribution,
      employerContribution,
    };
  }

  /**
   * Main payslip calculation method.
   * Orchestrates all calculations and returns complete payslip data.
   */
  calculatePayslip(
    employee: Employee,
    payRun: PayRun,
    additions: {
      overtime?: number;
      bonus?: number;
      commission?: number;
      otherAdditions?: number;
      otherDeductions?: number;
    } = {},
  ): PayslipCalculation {
    // Initialize amounts in pence
    const overtimePay = Math.round((additions.overtime || 0) * 100);
    const bonusPay = Math.round((additions.bonus || 0) * 100);
    const commissionPay = Math.round((additions.commission || 0) * 100);
    const otherAdditions = Math.round((additions.otherAdditions || 0) * 100);
    const otherDeductions = Math.round((additions.otherDeductions || 0) * 100);

    // Basic pay calculation
    let basicPay = 0;
    if (employee.payMethod === PayMethod.SALARY || employee.payMethod === PayMethod.HOURLY) {
      basicPay = Math.round(parseFloat(employee.basicPayRate.toString()));
    }

    // Gross pay = basic + additions
    const grossPay = basicPay + overtimePay + bonusPay + commissionPay + otherAdditions;

    // Get cumulative figures (could be from previous payslips or P45)
    let cumulativeGross = Math.round(parseFloat(employee.cumulativeGrossPay.toString()));
    let cumulativeTax = Math.round(parseFloat(employee.cumulativeTaxPaid.toString()));
    let cumulativeNiEmp = Math.round(parseFloat(employee.cumulativeNiEmployee.toString()));

    // Add P45 amounts if present
    if (employee.previousEmploymentPay) {
      cumulativeGross += Math.round(parseFloat(employee.previousEmploymentPay.toString()));
    }
    if (employee.previousEmploymentTax) {
      cumulativeTax += Math.round(parseFloat(employee.previousEmploymentTax.toString()));
    }

    // Calculate PAYE
    const taxCalc = this.calculatePaye(
      employee.taxCode,
      grossPay,
      cumulativeGross,
      cumulativeTax,
      payRun.taxPeriod,
      employee.payFrequency,
    );

    // Taxable gross (after pension contributions for tax purposes in some cases)
    // For now, use gross as taxable
    const taxableGross = grossPay;

    // Calculate National Insurance
    const niCalc = this.calculateNI(
      employee.niCategory,
      grossPay,
      employee.payFrequency,
    );

    // Calculate Student Loan
    const studentLoanDeduction = this.calculateStudentLoan(
      employee.studentLoanPlan,
      grossPay,
      employee.payFrequency,
    );

    // Calculate Pension
    let pensionEmployeeContribution = 0;
    let pensionEmployerContribution = 0;

    if (!employee.pensionOptOut) {
      const pensionCalc = this.calculatePension(
        grossPay,
        parseFloat(employee.pensionContributionPct.toString()),
        parseFloat(employee.employerPensionPct.toString()),
        employee.payFrequency,
      );
      pensionEmployeeContribution = pensionCalc.employeeContribution;
      pensionEmployerContribution = pensionCalc.employerContribution;
    }

    // Calculate net pay
    const totalDeductions = taxCalc.taxDue + niCalc.employeeNi +
                          studentLoanDeduction + pensionEmployeeContribution + otherDeductions;
    const netPay = Math.max(0, grossPay - totalDeductions);

    // Update cumulative NI
    const newCumulativeNiEmp = Math.round(cumulativeNiEmp + niCalc.employeeNi);

    return {
      basicPay,
      overtimePay,
      bonusPay,
      commissionPay,
      grossPay,
      taxableGross,
      taxDeducted: taxCalc.taxDue,
      niEmployeeContribution: niCalc.employeeNi,
      niEmployerContribution: niCalc.employerNi,
      niablePay: niCalc.niablePay,
      studentLoanDeduction,
      pensionEmployeeContribution,
      pensionEmployerContribution,
      otherDeductions,
      otherAdditions,
      netPay,
      cumulativeGrossPay: taxCalc.cumulativeGross,
      cumulativeTaxPaid: taxCalc.cumulativeTax,
      cumulativeNiEmployee: newCumulativeNiEmp,
    };
  }
}
