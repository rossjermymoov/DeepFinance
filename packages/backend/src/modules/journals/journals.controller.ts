import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { JournalsService } from './journals.service';
import {
  CreateJournalDto,
  PostJournalDto,
  ReverseJournalDto,
  JournalQueryDto,
} from './journals.dto';

@ApiTags('journals')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  // ================================================================
  // CRUD
  // ================================================================

  @Get()
  @ApiOperation({ summary: 'List journals with filtering and pagination' })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: JournalQueryDto,
  ) {
    return this.journalsService.findAll(tenantId, entityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a journal by ID with all lines' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.journalsService.findById(tenantId, entityId, id);
  }

  @Get('by-number/:journalNumber')
  @ApiOperation({ summary: 'Get a journal by its journal number (e.g., JNL-000001)' })
  async findByNumber(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('journalNumber') journalNumber: string,
  ) {
    return this.journalsService.findByNumber(tenantId, entityId, journalNumber);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new journal (DRAFT status)',
    description: 'Creates a double-entry journal. Debits must equal credits. Minimum 2 lines. Each line must have either a debit or credit, not both.',
  })
  @ApiResponse({ status: 201, description: 'Journal created in DRAFT status' })
  @ApiResponse({ status: 400, description: 'Validation error (unbalanced, invalid accounts, etc.)' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateJournalDto,
  ) {
    // TODO: extract userId from JWT
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.journalsService.create(tenantId, entityId, dto, userId);
  }

  // ================================================================
  // POSTING & REVERSAL
  // ================================================================

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Post a draft journal to the general ledger',
    description: 'Commits the journal. Posted journals are immutable. The financial period must be open.',
  })
  @ApiResponse({ status: 200, description: 'Journal posted successfully' })
  @ApiResponse({ status: 409, description: 'Journal is not in DRAFT status' })
  async post(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostJournalDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.journalsService.post(tenantId, entityId, id, dto, userId);
  }

  @Post(':id/reverse')
  @ApiOperation({
    summary: 'Reverse a posted journal',
    description: 'Creates a new journal that mirrors the original with debits and credits swapped. The original is marked as reversed.',
  })
  @ApiResponse({ status: 201, description: 'Reversing journal created and posted' })
  @ApiResponse({ status: 409, description: 'Journal is not POSTED or already reversed' })
  async reverse(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseJournalDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.journalsService.reverse(tenantId, entityId, id, dto, userId);
  }

  // ================================================================
  // REPORTING
  // ================================================================

  @Get('reports/trial-balance')
  @ApiOperation({
    summary: 'Get trial balance as at a specific date',
    description: 'Aggregates all posted journal lines by account. Debits must equal credits.',
  })
  async getTrialBalance(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query('asAtDate') asAtDate?: string,
  ) {
    return this.journalsService.getTrialBalance(tenantId, entityId, asAtDate);
  }

  @Get('reports/account-balance/:accountId')
  @ApiOperation({ summary: 'Get the balance for a single account' })
  async getAccountBalance(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('asAtDate') asAtDate?: string,
  ) {
    return this.journalsService.getAccountBalance(
      tenantId,
      entityId,
      accountId,
      asAtDate,
    );
  }

  @Get('reports/account-ledger/:accountId')
  @ApiOperation({
    summary: 'Get ledger entries for a specific account with running balance',
  })
  async getAccountLedger(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.journalsService.getAccountLedger(
      tenantId,
      entityId,
      accountId,
      dateFrom,
      dateTo,
    );
  }
}
