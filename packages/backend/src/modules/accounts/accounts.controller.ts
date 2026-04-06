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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';
import { UK_CHART_TEMPLATES } from './uk-chart-templates';

@ApiTags('accounts')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts in the chart of accounts' })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.accountsService.findAll(tenantId, entityId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List available chart of accounts templates' })
  async getTemplates() {
    return Object.entries(UK_CHART_TEMPLATES).map(([key, val]) => ({
      id: key,
      label: val.label,
      accountCount: val.accounts.length,
    }));
  }

  @Post('seed/:templateId')
  @ApiOperation({ summary: 'Seed chart of accounts from a UK template' })
  async seedFromTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('templateId') templateId: string,
  ) {
    const template = UK_CHART_TEMPLATES[templateId];
    if (!template) {
      return { error: `Template '${templateId}' not found. Available: ${Object.keys(UK_CHART_TEMPLATES).join(', ')}` };
    }

    const userId = '00000000-0000-0000-0000-000000000000';
    const results: { created: number; skipped: number; errors: string[] } = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const account of template.accounts) {
      try {
        // Check if account code already exists
        const existing = await this.accountsService.findByCode(tenantId, entityId, account.code);
        if (existing) {
          results.skipped++;
          continue;
        }

        await this.accountsService.create(tenantId, entityId, {
          code: account.code,
          name: account.name,
          accountType: account.accountType,
          accountSubType: account.accountSubType,
          description: account.description,
          isBankAccount: account.isBankAccount,
          currency: 'GBP',
        }, userId);
        results.created++;
      } catch (err) {
        results.errors.push(`${account.code}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return results;
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance for all accounts' })
  async getTrialBalance(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.accountsService.getTrialBalance(tenantId, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single account by ID' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountsService.findById(tenantId, entityId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateAccountDto,
  ) {
    // TODO: extract userId from JWT token
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.accountsService.create(tenantId, entityId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing account' })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.accountsService.update(tenantId, entityId, id, dto, userId);
  }
}
