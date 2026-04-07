import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { HmrcRtiService } from './hmrc-rti.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  CreatePayRunDto,
  PayrollSettingsDto,
  HmrcCallbackDto,
  HmrcAuthUrlResponseDto,
  HmrcCallbackResponseDto,
  PayslipAdditionsDto,
} from './payroll.dto';
import { PayRunStatus } from './pay-run.entity';

@ApiTags('payroll')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly hmrcRtiService: HmrcRtiService,
  ) {}

  // ======================================
  // Settings Endpoints
  // ======================================

  @Get('settings')
  @ApiOperation({ summary: 'Get payroll settings for entity' })
  async getSettings(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.payrollService.getPayrollSettings(tenantId, entityId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update payroll settings' })
  async updateSettings(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: PayrollSettingsDto,
  ) {
    return this.payrollService.updatePayrollSettings(
      tenantId,
      entityId,
      dto,
      userId,
    );
  }

  // ======================================
  // Employee Endpoints
  // ======================================

  @Get('employees')
  @ApiOperation({ summary: 'List all employees' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async listEmployees(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query('active') active?: string,
  ) {
    const isActive =
      active === 'true' ? true : active === 'false' ? false : undefined;
    return this.payrollService.listEmployees(tenantId, entityId, isActive);
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create a new employee' })
  async createEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.payrollService.createEmployee(tenantId, entityId, dto, userId);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async getEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) employeeId: string,
  ) {
    return this.payrollService.getEmployee(tenantId, entityId, employeeId);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  async updateEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.payrollService.updateEmployee(
      tenantId,
      entityId,
      employeeId,
      dto,
      userId,
    );
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Deactivate employee' })
  async deactivateEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) employeeId: string,
  ) {
    return this.payrollService.deactivateEmployee(
      tenantId,
      entityId,
      employeeId,
      userId,
    );
  }

  // ======================================
  // Pay Run Endpoints
  // ======================================

  @Get('pay-runs')
  @ApiOperation({ summary: 'List pay runs' })
  @ApiQuery({ name: 'status', required: false, enum: PayRunStatus })
  async listPayRuns(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query('status') status?: PayRunStatus,
  ) {
    return this.payrollService.listPayRuns(tenantId, entityId, status);
  }

  @Post('pay-runs')
  @ApiOperation({ summary: 'Create new pay run' })
  async createPayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreatePayRunDto,
  ) {
    return this.payrollService.createPayRun(tenantId, entityId, dto, userId);
  }

  @Get('pay-runs/:id')
  @ApiOperation({ summary: 'Get pay run by ID' })
  async getPayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.getPayRun(tenantId, entityId, payRunId);
  }

  @Post('pay-runs/:id/calculate')
  @ApiOperation({ summary: 'Calculate payslips for pay run' })
  async calculatePayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.calculatePayRun(tenantId, entityId, payRunId, userId);
  }

  @Post('pay-runs/:id/recalculate')
  @ApiOperation({ summary: 'Recalculate payslips for pay run' })
  async recalculatePayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.recalculatePayRun(tenantId, entityId, payRunId, userId);
  }

  @Post('pay-runs/:id/review')
  @ApiOperation({ summary: 'Mark pay run as reviewed' })
  async reviewPayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.reviewPayRun(tenantId, entityId, payRunId, userId);
  }

  @Post('pay-runs/:id/submit')
  @ApiOperation({ summary: 'Submit pay run to HMRC' })
  async submitPayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.submitPayRun(tenantId, entityId, payRunId, userId);
  }

  @Post('pay-runs/:id/complete')
  @ApiOperation({ summary: 'Complete pay run and finalize payroll' })
  async completePayRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.completePayRun(tenantId, entityId, payRunId, userId);
  }

  // ======================================
  // Payslip Endpoints
  // ======================================

  @Get('pay-runs/:id/payslips')
  @ApiOperation({ summary: 'Get payslips for a pay run' })
  async getPayslipsForRun(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) payRunId: string,
  ) {
    return this.payrollService.getPayslipsForRun(tenantId, entityId, payRunId);
  }

  @Get('employees/:id/payslips')
  @ApiOperation({ summary: 'Get payslip history for employee' })
  async getPayslipsForEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) employeeId: string,
  ) {
    return this.payrollService.getPayslipsForEmployee(
      tenantId,
      entityId,
      employeeId,
    );
  }

  // ======================================
  // Dashboard/Summary Endpoints
  // ======================================

  @Get('summary')
  @ApiOperation({ summary: 'Get payroll dashboard summary' })
  async getPayrollSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.payrollService.getPayrollSummary(tenantId, entityId);
  }

  // ======================================
  // HMRC OAuth Endpoints
  // ======================================

  @Post('hmrc/auth-url')
  @ApiOperation({ summary: 'Get HMRC OAuth authorization URL' })
  async getHmrcAuthUrl(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ): Promise<HmrcAuthUrlResponseDto> {
    const state = `${tenantId}:${entityId}:${Date.now()}`;
    const authUrl = this.hmrcRtiService.getAuthUrl(state);

    return {
      authUrl,
      state,
    };
  }

  @Post('hmrc/callback')
  @ApiOperation({ summary: 'Handle HMRC OAuth callback' })
  async handleHmrcCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: HmrcCallbackDto,
  ): Promise<HmrcCallbackResponseDto> {
    // Validate state format
    const stateParts = dto.state.split(':');
    if (
      stateParts.length !== 3 ||
      stateParts[0] !== tenantId ||
      stateParts[1] !== entityId
    ) {
      throw new BadRequestException('Invalid state parameter');
    }

    // Get settings
    const settings = await this.payrollService.getPayrollSettings(
      tenantId,
      entityId,
    );

    // Exchange code for tokens
    const tokens = await this.hmrcRtiService.exchangeCode(dto.code, settings);

    // Update settings
    settings.hmrcAccessToken = tokens.accessToken;
    settings.hmrcRefreshToken = tokens.refreshToken;
    settings.hmrcTokenExpiresAt = new Date(
      Date.now() + tokens.expiresIn * 1000,
    );

    await this.payrollService.updatePayrollSettings(
      tenantId,
      entityId,
      settings,
      userId,
    );

    return {
      success: true,
      message: 'HMRC connection established successfully',
      accessToken: tokens.accessToken,
    };
  }
}
