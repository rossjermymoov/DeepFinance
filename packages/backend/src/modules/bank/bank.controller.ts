import {
  Controller,
  Get,
  Post,
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
import { BankService } from './bank.service';
import {
  CreateBankTransactionDto,
  ImportBankTransactionsDto,
  ReconcileTransactionDto,
  BankTransactionQueryDto,
} from './bank.dto';

@ApiTags('bank-transactions')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('bank-transactions')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get()
  @ApiOperation({
    summary: 'List bank transactions',
    description: 'Get bank transactions with optional filtering and pagination',
  })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: BankTransactionQueryDto,
  ) {
    return this.bankService.findAll(tenantId, entityId, query);
  }

  @Get('summary/:bankAccountId')
  @ApiOperation({
    summary: 'Get reconciliation summary',
    description: 'Get counts and totals by reconciliation status',
  })
  async getReconciliationSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
  ) {
    return this.bankService.getReconciliationSummary(tenantId, entityId, bankAccountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank transaction by ID' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bankService.findById(tenantId, entityId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a single bank transaction' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateBankTransactionDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.bankService.create(tenantId, entityId, dto, userId);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import bank transactions',
    description: 'Bulk import transactions with a shared import batch ID',
  })
  async importBatch(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: ImportBankTransactionsDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.bankService.importBatch(tenantId, entityId, dto, userId);
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: 'Mark transaction as reconciled' })
  async reconcile(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReconcileTransactionDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.bankService.reconcile(tenantId, entityId, id, dto, userId);
  }

  @Post(':id/unreconcile')
  @ApiOperation({ summary: 'Mark transaction as unreconciled' })
  async unreconcile(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.bankService.unreconcile(tenantId, entityId, id, userId);
  }

  @Post(':id/exclude')
  @ApiOperation({ summary: 'Exclude transaction from reconciliation' })
  async exclude(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.bankService.exclude(tenantId, entityId, id, userId);
  }
}
