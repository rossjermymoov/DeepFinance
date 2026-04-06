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
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryDto,
  RecordPaymentDto,
} from './invoices.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List all invoices with optional filtering and pagination',
  })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: InvoiceQueryDto,
  ) {
    return this.invoicesService.findAll(tenantId, entityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID with all line items' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.findById(tenantId, entityId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description: 'Creates an invoice in DRAFT status with line items',
  })
  @ApiResponse({ status: 201, description: 'Invoice created in DRAFT status' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.invoicesService.create(tenantId, entityId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an invoice',
    description: 'Only DRAFT invoices can be updated',
  })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.invoicesService.update(tenantId, entityId, id, dto, userId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve and send an invoice',
    description: 'Transitions a DRAFT invoice to SENT status',
  })
  async approve(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.invoicesService.approve(tenantId, entityId, id, userId);
  }

  @Post(':id/record-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a payment against an invoice',
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
    return this.invoicesService.recordPayment(tenantId, entityId, id, dto, userId);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void an invoice',
    description: 'Marks an invoice as VOID. Cannot void PAID or already VOID invoices.',
  })
  async void(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.invoicesService.void(tenantId, entityId, id, userId);
  }
}
