import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VatSettings } from './vat-settings.entity';
import { VatReturn } from './vat-return.entity';
import { HmrcSubmitPayload } from './vat.dto';

/**
 * HMRC Making Tax Digital (MTD) VAT API integration service.
 * Handles OAuth flows and VAT return submission/retrieval.
 */
@Injectable()
export class HmrcMtdService {
  private readonly logger = new Logger(HmrcMtdService.name);
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
      'http://localhost:3000/api/vat/auth/callback';
  }

  /**
   * Generate HMRC OAuth authorization URL.
   */
  getAuthUrl(state: string): string {
    const scope = 'read:vat+write:vat';
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
    settings: VatSettings,
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
  async refreshAccessToken(settings: VatSettings): Promise<{
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
  async ensureValidToken(settings: VatSettings): Promise<string> {
    if (!settings.hmrcAccessToken) {
      throw new BadRequestException('No HMRC access token configured');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (settings.hmrcTokenExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(settings.hmrcTokenExpiresAt);
      const bufferMs = 5 * 60 * 1000; // 5 minutes

      if (now.getTime() + bufferMs >= expiresAt.getTime()) {
        const refreshed = await this.refreshAccessToken(settings);
        // Note: The service calling this must update the settings with new token
        return refreshed.accessToken;
      }
    }

    return settings.hmrcAccessToken;
  }

  /**
   * Get VAT obligations from HMRC.
   * Returns the list of VAT periods for which returns are due.
   */
  async getObligations(
    settings: VatSettings,
    fromDate: string,
    toDate: string,
  ): Promise<any[]> {
    if (!settings.vatNumber || !settings.isRegistered) {
      throw new BadRequestException('Entity not registered for VAT');
    }

    const accessToken = await this.ensureValidToken(settings);
    const vrn = settings.vatNumber.replace(/[^0-9]/g, '');

    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        status: 'O', // O = Open, F = Fulfilled
      });

      const response = await fetch(
        `${this.baseUrl}/organisations/vat/${vrn}/obligations?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.hmrc.1.0+json',
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HMRC error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return (data.obligations || []) as any[];
    } catch (error) {
      this.logger.error('Failed to fetch HMRC obligations:', error);
      throw this.handleHmrcError(error);
    }
  }

  /**
   * Submit a VAT return to HMRC.
   */
  async submitReturn(
    settings: VatSettings,
    payload: HmrcSubmitPayload,
  ): Promise<{
    correlationId: string;
    receiptId?: string;
    processingDate?: string;
    paymentDueDate?: string;
  }> {
    if (!settings.vatNumber || !settings.isRegistered) {
      throw new BadRequestException('Entity not registered for VAT');
    }

    const accessToken = await this.ensureValidToken(settings);
    const vrn = settings.vatNumber.replace(/[^0-9]/g, '');

    try {
      const response = await fetch(
        `${this.baseUrl}/organisations/vat/${vrn}/returns`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.hmrc.1.0+json',
            'Content-Type': 'application/json',
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HMRC error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        correlationId:
          response.headers.get('x-correlation-id') ||
          (data.correlationId as string),
        receiptId: data.receiptId as string | undefined,
        processingDate: data.processingDate as string | undefined,
        paymentDueDate: data.paymentDueDate as string | undefined,
      };
    } catch (error) {
      this.logger.error('Failed to submit VAT return to HMRC:', error);
      throw this.handleHmrcError(error);
    }
  }

  /**
   * Retrieve a previously submitted VAT return.
   */
  async viewReturn(
    settings: VatSettings,
    periodKey: string,
  ): Promise<any> {
    if (!settings.vatNumber || !settings.isRegistered) {
      throw new BadRequestException('Entity not registered for VAT');
    }

    const accessToken = await this.ensureValidToken(settings);
    const vrn = settings.vatNumber.replace(/[^0-9]/g, '');

    try {
      const response = await fetch(
        `${this.baseUrl}/organisations/vat/${vrn}/returns/${periodKey}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.hmrc.1.0+json',
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HMRC error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to retrieve VAT return from HMRC:', error);
      throw this.handleHmrcError(error);
    }
  }

  /**
   * Handle HMRC API errors and convert to appropriate exceptions.
   */
  private handleHmrcError(error: any): Error {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('401') || message.includes('403')) {
      return new BadRequestException('HMRC authentication failed. Please re-authenticate.');
    }

    if (message.includes('400')) {
      return new BadRequestException(`HMRC validation error: ${message}`);
    }

    if (message.includes('404')) {
      return new BadRequestException('VAT return or obligation not found on HMRC');
    }

    if (message.includes('409')) {
      return new BadRequestException('Conflict: VAT return may already have been submitted');
    }

    if (message.includes('429')) {
      return new BadRequestException('Rate limited by HMRC. Please try again later.');
    }

    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return new BadRequestException('HMRC service temporarily unavailable');
    }

    return new BadRequestException('Failed to communicate with HMRC');
  }
}
