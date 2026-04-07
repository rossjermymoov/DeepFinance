import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, PayFrequency } from './employee.entity';
import { PayRun, PayRunStatus } from './pay-run.entity';
import { Payslip } from './payslip.entity';
import { PayrollSettings } from './payroll-settings.entity';
import { CreateEmployeeDto, UpdateEmployeeDto, CreatePayRunDto, PayrollSettingsDto } from './payroll.dto';
import { PayrollCalculationService, PayslipCalculation } from './payroll-calculation.service';
import { HmrcRtiService } from './hmrc-rti.service';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(PayRun)
    private readonly payRunRepo: Repository<PayRun>,
    @InjectRepository(Payslip)
    private readonly payslipRepo: Repository<Payslip>,
    @InjectRepository(PayrollSettings)
    private readonly settingsRepo: Repository<PayrollSettings>,
    private readonly calculationService: PayrollCalculationService,
    private readonly hmrcRtiService: HmrcRtiService,
  ) {}

  // ======================================
  // Employee Management
  // ======================================

  async createEmployee(
    tenantId: string,
    entityId: string,
    dto: CreateEmployeeDto,
    userId: string,
  ): Promise<Employee> {
    // Check for duplicate employee number
    const existing = await this.employeeRepo.findOne({
      where: { tenantId, entityId, employeeNumber: dto.employeeNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Employee number ${dto.employeeNumber} already exists`,
      );
    }

    const employee = this.employeeRepo.create({
      ...dto,
      dateOfBirth: dto.dateOfBirth as any,
      startDate: dto.startDate as any,
      leaveDate: dto.leaveDate ? (dto.leaveDate as any) : undefined,
      tenantId,
      entityId,
      createdBy: userId,
      updatedBy: userId,
    } as any) as unknown as Employee;

    return this.employeeRepo.save(employee);
  }

  async updateEmployee(
    tenantId: string,
    entityId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
    userId: string,
  ): Promise<Employee> {
    const employee = await this.getEmployee(tenantId, entityId, employeeId);

    // Check for duplicate employee number if being changed
    if (dto.employeeNumber && dto.employeeNumber !== employee.employeeNumber) {
      const existing = await this.employeeRepo.findOne({
        where: {
          tenantId,
          entityId,
          employeeNumber: dto.employeeNumber,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Employee number ${dto.employeeNumber} already exists`,
        );
      }
    }

    const updateData: any = { ...dto };
    if (dto.dateOfBirth) {
      updateData.dateOfBirth = new Date(dto.dateOfBirth);
    }
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.leaveDate) {
      updateData.leaveDate = new Date(dto.leaveDate);
    }
    updateData.updatedBy = userId;

    Object.assign(employee, updateData);
    return this.employeeRepo.save(employee);
  }

  async listEmployees(
    tenantId: string,
    entityId: string,
    isActive?: boolean,
  ): Promise<Employee[]> {
    const query: any = { tenantId, entityId };
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    return this.employeeRepo.find({
      where: query,
      order: { employeeNumber: 'ASC' },
    });
  }

  async getEmployee(
    tenantId: string,
    entityId: string,
    employeeId: string,
  ): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId, entityId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    return employee;
  }

  async deactivateEmployee(
    tenantId: string,
    entityId: string,
    employeeId: string,
    userId: string,
  ): Promise<Employee> {
    const employee = await this.getEmployee(tenantId, entityId, employeeId);
    employee.isActive = false;
    employee.updatedBy = userId;
    return this.employeeRepo.save(employee);
  }

  // ======================================
  // Pay Run Management
  // ======================================

  async createPayRun(
    tenantId: string,
    entityId: string,
    dto: CreatePayRunDto,
    userId: string,
  ): Promise<PayRun> {
    const taxYear = dto.taxYear || '2025-26';

    // Generate unique pay run number
    const existingCount = await this.payRunRepo.count({
      where: { tenantId, entityId, taxYear },
    });
    const payRunNumber = `${taxYear}-${String(dto.taxPeriod).padStart(2, '0')}-${String(existingCount + 1).padStart(3, '0')}`;

    // Check for duplicate period
    const existing = await this.payRunRepo.findOne({
      where: {
        tenantId,
        entityId,
        taxYear,
        taxPeriod: dto.taxPeriod,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Pay run already exists for ${taxYear} period ${dto.taxPeriod}`,
      );
    }

    const payRun = this.payRunRepo.create({
      ...dto,
      taxYear,
      payRunNumber,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      paymentDate: new Date(dto.paymentDate),
      status: PayRunStatus.DRAFT,
      tenantId,
      entityId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.payRunRepo.save(payRun);
  }

  async listPayRuns(
    tenantId: string,
    entityId: string,
    status?: PayRunStatus,
  ): Promise<PayRun[]> {
    const query: any = { tenantId, entityId };
    if (status) {
      query.status = status;
    }

    return this.payRunRepo.find({
      where: query,
      order: { periodStart: 'DESC' },
    });
  }

  async getPayRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
  ): Promise<PayRun> {
    const payRun = await this.payRunRepo.findOne({
      where: { id: payRunId, tenantId, entityId },
    });
    if (!payRun) {
      throw new NotFoundException(`Pay run ${payRunId} not found`);
    }
    return payRun;
  }

  // ======================================
  // Payslip Calculation
  // ======================================

  async calculatePayRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
    userId: string,
  ): Promise<PayRun> {
    const payRun = await this.getPayRun(tenantId, entityId, payRunId);

    if (payRun.status !== PayRunStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft pay runs can be calculated',
      );
    }

    // Get all active employees
    const employees = await this.listEmployees(tenantId, entityId, true);

    // Calculate payslips for each employee
    let totalGross = 0;
    let totalTax = 0;
    let totalNiEmp = 0;
    let totalNiEr = 0;
    let totalStudentLoan = 0;
    let totalPensionEmp = 0;
    let totalPensionEr = 0;

    const payslips: Payslip[] = [];

    for (const employee of employees) {
      // Check if employee was employed during this period
      if (
        employee.leaveDate &&
        new Date(employee.leaveDate) < payRun.periodStart
      ) {
        continue;
      }

      const calculation = this.calculationService.calculatePayslip(
        employee,
        payRun,
      );

      const payslip = this.payslipRepo.create({
        payRunId,
        employeeId: employee.id,
        basicPay: calculation.basicPay,
        overtimePay: calculation.overtimePay,
        bonusPay: calculation.bonusPay,
        commissionPay: calculation.commissionPay,
        grossPay: calculation.grossPay,
        taxableGross: calculation.taxableGross,
        taxDeducted: calculation.taxDeducted,
        niEmployeeContribution: calculation.niEmployeeContribution,
        niEmployerContribution: calculation.niEmployerContribution,
        niablePay: calculation.niablePay,
        studentLoanDeduction: calculation.studentLoanDeduction,
        pensionEmployeeContribution: calculation.pensionEmployeeContribution,
        pensionEmployerContribution: calculation.pensionEmployerContribution,
        otherDeductions: calculation.otherDeductions,
        otherAdditions: calculation.otherAdditions,
        netPay: calculation.netPay,
        taxCode: employee.taxCode,
        niCategory: employee.niCategory,
        payMethod: employee.payMethod,
        cumulativeGrossPay: calculation.cumulativeGrossPay,
        cumulativeTaxPaid: calculation.cumulativeTaxPaid,
        cumulativeNiEmployee: calculation.cumulativeNiEmployee,
        tenantId,
        entityId,
        createdBy: userId,
        updatedBy: userId,
      });

      payslips.push(payslip);
      totalGross += calculation.grossPay;
      totalTax += calculation.taxDeducted;
      totalNiEmp += calculation.niEmployeeContribution;
      totalNiEr += calculation.niEmployerContribution;
      totalStudentLoan += calculation.studentLoanDeduction;
      totalPensionEmp += calculation.pensionEmployeeContribution;
      totalPensionEr += calculation.pensionEmployerContribution;
    }

    // Save all payslips
    await this.payslipRepo.save(payslips);

    // Update pay run with totals
    payRun.status = PayRunStatus.CALCULATED;
    payRun.totalGrossPay = totalGross;
    payRun.totalTaxDeducted = totalTax;
    payRun.totalNiEmployee = totalNiEmp;
    payRun.totalNiEmployer = totalNiEr;
    payRun.totalStudentLoan = totalStudentLoan;
    payRun.totalPensionEmployee = totalPensionEmp;
    payRun.totalPensionEmployer = totalPensionEr;
    payRun.totalNetPay = totalGross - totalTax - totalNiEmp - totalStudentLoan - totalPensionEmp;
    payRun.employeeCount = payslips.length;
    payRun.updatedBy = userId;

    return this.payRunRepo.save(payRun);
  }

  async recalculatePayRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
    userId: string,
  ): Promise<PayRun> {
    const payRun = await this.getPayRun(tenantId, entityId, payRunId);

    // Delete existing payslips
    await this.payslipRepo.delete({ payRunId });

    // Reset pay run to draft
    payRun.status = PayRunStatus.DRAFT;
    payRun.totalGrossPay = 0;
    payRun.totalTaxDeducted = 0;
    payRun.totalNiEmployee = 0;
    payRun.totalNiEmployer = 0;
    payRun.totalStudentLoan = 0;
    payRun.totalPensionEmployee = 0;
    payRun.totalPensionEmployer = 0;
    payRun.totalNetPay = 0;
    payRun.employeeCount = 0;
    payRun.updatedBy = userId;
    await this.payRunRepo.save(payRun);

    // Recalculate
    return this.calculatePayRun(tenantId, entityId, payRunId, userId);
  }

  async reviewPayRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
    userId: string,
  ): Promise<PayRun> {
    const payRun = await this.getPayRun(tenantId, entityId, payRunId);

    if (payRun.status !== PayRunStatus.CALCULATED) {
      throw new BadRequestException(
        'Only calculated pay runs can be reviewed',
      );
    }

    payRun.status = PayRunStatus.REVIEWED;
    payRun.updatedBy = userId;
    return this.payRunRepo.save(payRun);
  }

  async submitPayRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
    userId: string,
  ): Promise<PayRun> {
    const payRun = await this.getPayRun(tenantId, entityId, payRunId);

    if (payRun.status !== PayRunStatus.REVIEWED) {
      throw new BadRequestException(
        'Only reviewed pay runs can be submitted',
      );
    }

    // Get settings and payslips
    const settings = await this.getPayrollSettings(tenantId, entityId);
    const payslips = await this.payslipRepo.find({ where: { payRunId } });

    if (!settings.employerPayeRef || !settings.hmrcAccessToken) {
      throw new BadRequestException(
        'Payroll settings not configured for HMRC submission',
      );
    }

    // Build employee map
    const employeeIds = [...new Set(payslips.map((p) => p.employeeId))];
    const employees = await this.employeeRepo.find({
      where: { id: employeeIds as any },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    // Submit FPS to HMRC
    const fpsResult = await this.hmrcRtiService.submitFPS(
      settings,
      payRun,
      payslips,
      employeeMap,
    );

    payRun.status = PayRunStatus.SUBMITTED;
    payRun.hmrcSubmissionId = fpsResult.submissionId;
    payRun.submittedAt = new Date();
    payRun.updatedBy = userId;

    // Update settings with last submission date
    settings.lastRtiSubmissionAt = new Date();
    await this.settingsRepo.save(settings);

    return this.payRunRepo.save(payRun);
  }

  async completePayRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
    userId: string,
  ): Promise<PayRun> {
    const payRun = await this.getPayRun(tenantId, entityId, payRunId);

    if (payRun.status !== PayRunStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only submitted pay runs can be completed',
      );
    }

    // Get payslips
    const payslips = await this.payslipRepo.find({ where: { payRunId } });

    // Update employee cumulative figures
    const employeeUpdates = new Map<string, any>();

    for (const payslip of payslips) {
      if (!employeeUpdates.has(payslip.employeeId)) {
        employeeUpdates.set(payslip.employeeId, {
          cumulativeGrossPay: payslip.cumulativeGrossPay,
          cumulativeTaxPaid: payslip.cumulativeTaxPaid,
          cumulativeNiEmployee: payslip.cumulativeNiEmployee,
        });
      }
    }

    // Save updates
    for (const [employeeId, updates] of employeeUpdates) {
      await this.employeeRepo.update({ id: employeeId }, updates);
    }

    payRun.status = PayRunStatus.COMPLETED;
    payRun.updatedBy = userId;

    return this.payRunRepo.save(payRun);
  }

  async getPayslipsForRun(
    tenantId: string,
    entityId: string,
    payRunId: string,
  ): Promise<Payslip[]> {
    // Verify pay run exists
    await this.getPayRun(tenantId, entityId, payRunId);

    return this.payslipRepo.find({
      where: { payRunId, tenantId, entityId },
      order: { createdAt: 'ASC' },
    });
  }

  async getPayslipsForEmployee(
    tenantId: string,
    entityId: string,
    employeeId: string,
  ): Promise<Payslip[]> {
    // Verify employee exists
    await this.getEmployee(tenantId, entityId, employeeId);

    return this.payslipRepo.find({
      where: { employeeId, tenantId, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  // ======================================
  // Payroll Settings
  // ======================================

  async getPayrollSettings(
    tenantId: string,
    entityId: string,
  ): Promise<PayrollSettings> {
    let settings = await this.settingsRepo.findOne({
      where: { tenantId, entityId },
    });

    if (!settings) {
      // Create default settings if not exist
      settings = this.settingsRepo.create({
        tenantId,
        entityId,
        taxYear: '2025-26',
      });
      settings = await this.settingsRepo.save(settings);
    }

    return settings;
  }

  async updatePayrollSettings(
    tenantId: string,
    entityId: string,
    dto: PayrollSettingsDto,
    userId: string,
  ): Promise<PayrollSettings> {
    let settings = await this.getPayrollSettings(tenantId, entityId);

    Object.assign(settings, dto);
    settings.updatedBy = userId;

    return this.settingsRepo.save(settings);
  }

  // ======================================
  // Dashboard/Summary
  // ======================================

  async getPayrollSummary(
    tenantId: string,
    entityId: string,
  ): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalYearToDateGross: number;
    totalYearToDateTax: number;
    totalYearToDateNiEmployee: number;
    totalYearToDateNiEmployer: number;
    pendingPayRuns: number;
    submittedPayRuns: number;
    lastSubmissionDate?: Date;
  }> {
    const allEmployees = await this.employeeRepo.find({
      where: { tenantId, entityId },
    });
    const activeEmployees = allEmployees.filter((e) => e.isActive);

    const pendingPayRuns = await this.payRunRepo.count({
      where: { tenantId, entityId, status: PayRunStatus.DRAFT },
    });

    const submittedPayRuns = await this.payRunRepo.count({
      where: { tenantId, entityId, status: PayRunStatus.SUBMITTED },
    });

    const settings = await this.getPayrollSettings(tenantId, entityId);

    // Calculate totals from employee cumulative figures
    let totalGross = 0;
    let totalTax = 0;
    let totalNiEmp = 0;
    let totalNiEr = 0;

    for (const emp of allEmployees) {
      totalGross += parseFloat(emp.cumulativeGrossPay.toString());
      totalTax += parseFloat(emp.cumulativeTaxPaid.toString());
      totalNiEmp += parseFloat(emp.cumulativeNiEmployee.toString());
      totalNiEr += parseFloat(emp.cumulativeNiEmployer.toString());
    }

    return {
      totalEmployees: allEmployees.length,
      activeEmployees: activeEmployees.length,
      totalYearToDateGross: totalGross,
      totalYearToDateTax: totalTax,
      totalYearToDateNiEmployee: totalNiEmp,
      totalYearToDateNiEmployer: totalNiEr,
      pendingPayRuns,
      submittedPayRuns,
      lastSubmissionDate: settings.lastRtiSubmissionAt,
    };
  }
}
