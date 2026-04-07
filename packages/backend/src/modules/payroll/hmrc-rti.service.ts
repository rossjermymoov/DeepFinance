import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayrollSettings } from './payroll-settings.entity';
import { PayRun } from './pay-run.entity';
import { Payslip } from './payslip.entity';
import { Employee } from './employee.entity';

/**
 * HMRC Real Time Information (RTI) API integration service.
 * Handles OAuth flows and RTI submission (Full Payment Submission and Employer Payment Summary).
 */
@Injectable()
export class HmrcRtiService {
  private readonly logger = new Logger(HmrcRtiService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('HMRC_API_BASE_URL') ||
      'https://test-api.service.hmrc.gov.uk';
    this.clientId =
      this.configService.get<string>('HMRC_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('HMRC_CLIENT_SECRET') || '';
    this.redirectUri =
      this.configService.get<string>('HMRC_REDIRECT_URI') ||
      'http://localhost:3000/api/payroll/hmrc/callback';
  }

  /**
   * Generate HMRC OAuth authorization URL for RTI connection.
   */
  getAuthUrl(state: string): string {
    const scope = 'read:paye+write:paye';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope,
      state,
    });

    return `https://www.tax.service.gov.uk/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens.
   */
  async exchangeCode(
    code: string,
    settings: PayrollSettings,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: settings.hmrcClientId || this.clientId,
        client_secret: settings.hmrcClientSecret || this.clientSecret,
        redirect_uri: this.redirectUri,
      });

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        body: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`HMRC OAuth error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        accessToken: data.access_token as string,
        refreshToken: data.refresh_token as string,
        expiresIn: (data.expires_in as number) || 3600,
      };
    } catch (error) {
      this.logger.error('Failed to exchange auth code:', error);
      throw new BadRequestException('Failed to authenticate with HMRC');
    }
  }

  /**
   * Refresh an expired access token.
   */
  async refreshAccessToken(settings: PayrollSettings): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (!settings.hmrcRefreshToken) {
      throw new BadRequestException('No refresh token available');
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: settings.hmrcRefreshToken,
        client_id: settings.hmrcClientId || this.clientId,
        client_secret: settings.hmrcClientSecret || this.clientSecret,
      });

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        body: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`HMRC refresh error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        accessToken: data.access_token as string,
        expiresIn: (data.expires_in as number) || 3600,
      };
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new BadRequestException('Failed to refresh HMRC token');
    }
  }

  /**
   * Ensure the access token is valid, refreshing if necessary.
   */
  async ensureValidToken(settings: PayrollSettings): Promise<string> {
    if (!settings.hmrcAccessToken) {
      throw new BadRequestException('No HMRC access token configured');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (settings.hmrcTokenExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(settings.hmrcTokenExpiresAt);
      const bufferMs = 5 * 60 * 1000; // 5 minutes

      if (now.getTime() + bufferMs >= expiresAt.getTime()) {
        // Token expired or about to expire, refresh it
        const refreshed = await this.refreshAccessToken(settings);
        // Update the token in settings (caller will save to DB)
        settings.hmrcAccessToken = refreshed.accessToken;
        settings.hmrcTokenExpiresAt = new Date(
          Date.now() + refreshed.expiresIn * 1000,
        );
        return refreshed.accessToken;
      }
    }

    return settings.hmrcAccessToken;
  }

  /**
   * Submit Full Payment Submission (FPS) to HMRC.
   * This is the monthly/weekly payment submission containing employee payment details.
   */
  async submitFPS(
    settings: PayrollSettings,
    payRun: PayRun,
    payslips: Payslip[],
    employees: Map<string, Employee>,
  ): Promise<{
    submissionId: string;
    timestamp: string;
  }> {
    if (!settings.employerPayeRef) {
      throw new BadRequestException('Employer PAYE Reference not configured');
    }

    const token = await this.ensureValidToken(settings);

    // Build FPS payload
    const fpsPayload = {
      taxYear: payRun.taxYear,
      taxMonth: payRun.taxPeriod,
      paymentDate: payRun.paymentDate.toISOString().split('T')[0],
      employees: payslips.map((payslip) => {
        const employee = employees.get(payslip.employeeId);
        if (!employee) {
          throw new BadRequestException(
            `Employee ${payslip.employeeId} not found`,
          );
        }

        return {
          employeeId: employee.employeeNumber,
          forename: employee.firstName,
          surname: employee.lastName,
          dateOfBirth: employee.dateOfBirth.toISOString().split('T')[0],
          niNumber: employee.niNumber,
          taxCode: payslip.taxCode,
          niCategory: payslip.niCategory,
          grossPay: (payslip.grossPay / 100).toFixed(2), // Convert pence to pounds
          incomeTax: (payslip.taxDeducted / 100).toFixed(2),
          employeeNi: (payslip.niEmployeeContribution / 100).toFixed(2),
          employerNi: (payslip.niEmployerContribution / 100).toFixed(2),
          studentLoan: (payslip.studentLoanDeduction / 100).toFixed(2),
          pensionContribution: (payslip.pensionEmployeeContribution / 100).toFixed(2),
        };
      }),
    };

    try {
      // Format PAYE reference: 123/AB12345 -> 123AB12345 for API
      const empRefFormatted = settings.employerPayeRef
        .replace('/', '')
        .toUpperCase();

      const response = await fetch(
        `${this.baseUrl}/organisations/paye/${empRefFormatted}/fps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(fpsPayload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('HMRC FPS submission error:', errorData);
        throw new Error(
          `HMRC FPS error: ${response.statusText} - ${JSON.stringify(errorData)}`,
        );
      }

      const data = (await response.json()) as any;

      return {
        submissionId: data.id as string,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to submit FPS:', error);
      throw new BadRequestException('Failed to submit FPS to HMRC');
    }
  }

  /**
   * Submit Employer Payment Summary (EPS) to HMRC.
   * This includes SMP, SPP, SAP recovery, CIS deductions, and Employment Allowance claims.
   */
  async submitEPS(
    settings: PayrollSettings,
    taxYear: string,
    taxMonth: number,
    data: {
      smp?: number; // Statutory Maternity Pay (pence)
      spp?: number; // Statutory Paternity Pay (pence)
      sapRecovery?: number; // Statutory Adoption Pay recovery (pence)
      cisDeductions?: number; // CIS deductions (pence)
      employmentAllowance?: number; // Employment Allowance claim (pence)
      employmentAllowanceClaimed?: boolean;
    },
  ): Promise<{
    submissionId: string;
    timestamp: string;
  }> {
    if (!settings.employerPayeRef) {
      throw new BadRequestException('Employer PAYE Reference not configured');
    }

    const token = await this.ensureValidToken(settings);

    // Build EPS payload
    const epsPayload = {
      taxYear,
      taxMonth,
      smp: data.smp ? (data.smp / 100).toFixed(2) : '0.00',
      spp: data.spp ? (data.spp / 100).toFixed(2) : '0.00',
      sapRecovery: data.sapRecovery
        ? (data.sapRecovery / 100).toFixed(2)
        : '0.00',
      cisDeductions: data.cisDeductions
        ? (data.cisDeductions / 100).toFixed(2)
        : '0.00',
      employmentAllowance: data.employmentAllowanceClaimed
        ? (data.employmentAllowance || 0) / 100
        : 0,
    };

    try {
      // Format PAYE reference
      const empRefFormatted = settings.employerPayeRef
        .replace('/', '')
        .toUpperCase();

      const response = await fetch(
        `${this.baseUrl}/organisations/paye/${empRefFormatted}/eps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(epsPayload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('HMRC EPS submission error:', errorData);
        throw new Error(
          `HMRC EPS error: ${response.statusText} - ${JSON.stringify(errorData)}`,
        );
      }

      const responseData = (await response.json()) as any;

      return {
        submissionId: responseData.id as string,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to submit EPS:', error);
      throw new BadRequestException('Failed to submit EPS to HMRC');
    }
  }

  /**
   * Get RTI submission status from HMRC.
   */
  async getSubmissionStatus(
    settings: PayrollSettings,
    submissionId: string,
  ): Promise<{
    status: string;
    processingDate?: string;
    errors?: Array<{
      code: string;
      message: string;
    }>;
  }> {
    if (!settings.employerPayeRef) {
      throw new BadRequestException('Employer PAYE Reference not configured');
    }

    const token = await this.ensureValidToken(settings);

    try {
      const empRefFormatted = settings.employerPayeRef
        .replace('/', '')
        .toUpperCase();

      const response = await fetch(
        `${this.baseUrl}/organisations/paye/${empRefFormatted}/submissions/${submissionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HMRC status check error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        status: data.status as string,
        processingDate: data.processingDate,
        errors: data.errors || [],
      };
    } catch (error) {
      this.logger.error('Failed to get submission status:', error);
      throw new BadRequestException('Failed to get submission status from HMRC');
    }
  }
}
