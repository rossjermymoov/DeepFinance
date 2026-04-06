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
import { BillsService } from './bills.service';
import {
  CreateBillDto,
  UpdateBillDto,
  BillQueryDto,
  RecordPaymentDto,
} from './bills.dto';

@ApiTags('bills')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all bills with optional filtering and pagination',
  })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: BillQueryDto,
  ) {
    return this.billsService.findAll(tenantId, entityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bill by ID with all line items' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.billsService.findById(tenantId, entityId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new bill',
    description: 'Creates a bill in DRAFT status with line items',
  })
  @ApiResponse({ status: 201, description: 'Bill created in DRAFT status' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateBillDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.billsService.create(tenantId, entityId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a bill',
    description: 'Only DRAFT bills can be updated',
  })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBillDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.billsService.update(tenantId, entityId, id, dto, userId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a bill',
    description: 'Transitions a DRAFT bill to APPROVED status',
  })
  async approve(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.billsService.approve(tenantId, entityId, id, userId);
  }

  @Post(':id/record-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a payment against a bill',
    description:
      'Updates amountPaid and transitions status to PARTIALLY_PAID or PAID',
  })
  async recordPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.billsService.recordPayment(tenantId, entityId, id, dto, userId);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void a bill',
    description: 'Marks a bill as VOID. Cannot void PAID or already VOID bills.',
  })
  async void(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.billsService.void(tenantId, entityId, id, userId);
  }
}
