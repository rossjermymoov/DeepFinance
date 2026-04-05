import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';

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
