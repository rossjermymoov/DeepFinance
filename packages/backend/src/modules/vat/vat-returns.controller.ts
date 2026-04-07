import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { VatService } from './vat.service';
import { HmrcMtdService } from './hmrc-mtd.service';
import {
  UpdateVatSettingsDto,
  CalculateVatReturnDto,
  VatReturnQueryDto,
  HmrcAuthUrlResponseDto,
  HmrcCallbackDto,
} from './vat.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('vat')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('vat')
export class VatReturnsController {
  constructor(
    private readonly vatService: VatService,
    private readonly hmrcMtdService: HmrcMtdService,
  ) {}

  // ======================================
  // VAT Settings Endpoints
  // ======================================

  @Get('settings')
  @ApiOperation({
    summary: 'Get VAT settings',
    description: 'Retrieve VAT configuration for the entity',
  })
  async getSettings(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.vatService.getSettings(tenantId, entityId);
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update VAT settings',
    description: 'Update VAT configuration (scheme, registration, flat rate, etc.)',
  })
  async updateSettings(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: UpdateVatSettingsDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.vatService.updateSettings(tenantId, entityId, dto, userId);
  }

  // ======================================
  // VAT Returns Endpoints
  // ======================================

  @Get('returns')
  @ApiOperation({
    summary: 'List VAT returns',
    description:
      'Get all VAT returns for the entity, with optional filtering by status and period',
  })
  async listReturns(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: VatReturnQueryDto,
  ) {
    return this.vatService.listReturns(tenantId, entityId, query);
  }

  @Get('returns/:id')
  @ApiOperation({ summary: 'Get VAT return details' })
  async getReturn(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vatService.getReturn(tenantId, entityId, id);
  }

  @Post('returns/calculate')
  @ApiOperation({
    summary: 'Calculate a new VAT return',
    description:
      'Calculate VAT boxes based on invoices/bills for the given period. Creates a CALCULATED status record.',
  })
  async calculateReturn(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CalculateVatReturnDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.vatService.calculateReturn(tenantId, entityId, dto, userId);
  }

  @Post('returns/:id/recalculate')
  @ApiOperation({
    summary: 'Recalculate an existing VAT return',
    description: 'Recalculate a DRAFT or CALCULATED return with current data',
  })
  async recalculateReturn(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.vatService.recalculateReturn(tenantId, entityId, id, userId);
  }

  @Post('returns/:id/review')
  @ApiOperation({
    summary: 'Review a VAT return',
    description: 'Mark a CALCULATED return as REVIEWED (ready for submission)',
  })
  async reviewReturn(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.vatService.reviewReturn(tenantId, entityId, id, userId);
  }

  @Post('returns/:id/submit')
  @ApiOperation({
    summary: 'Submit VAT return to HMRC',
    description:
      'Submit a REVIEWED return to HMRC MTD API. Entity must be registered for VAT.',
  })
  async submitReturn(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.vatService.submitReturn(tenantId, entityId, id, userId);
  }

  // ======================================
  // VAT Obligations Endpoints
  // ======================================

  @Get('obligations')
  @ApiOperation({
    summary: 'List VAT obligations',
    description: 'Get all VAT return periods synced from HMRC',
  })
  async listObligations(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.vatService.listObligations(tenantId, entityId);
  }

  @Post('obligations/sync')
  @ApiOperation({
    summary: 'Sync VAT obligations from HMRC',
    description: 'Fetch the next 2 years of VAT return periods from HMRC',
  })
  async syncObligations(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.vatService.syncObligations(tenantId, entityId, userId);
  }

  // ======================================
  // HMRC OAuth Endpoints
  // ======================================

  @Get('auth/url')
  @ApiOperation({
    summary: 'Get HMRC OAuth authorization URL',
    description: 'Generate the URL to redirect user to HMRC for OAuth authentication',
  })
  async getAuthUrl(): Promise<HmrcAuthUrlResponseDto> {
    const state = uuidv4();
    const authUrl = this.hmrcMtdService.getAuthUrl(state);

    // In production, store state in session/cache for CSRF validation
    return {
      authUrl,
      state,
    };
  }

  @Post('auth/callback')
  @ApiOperation({
    summary: 'Handle HMRC OAuth callback',
    description:
      'Exchange authorization code from HMRC for access/refresh tokens and link to settings',
  })
  async handleCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: HmrcCallbackDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    const settings = await this.vatService.getSettings(tenantId, entityId);

    // Exchange code for tokens
    const tokens = await this.hmrcMtdService.exchangeCode(dto.code, settings);

    // Link tokens to settings
    const updated = await this.vatService.linkHmrcTokens(
      tenantId,
      entityId,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
      userId,
    );

    return {
      message: 'Successfully authenticated with HMRC',
      vatSettings: updated,
    };
  }
}
