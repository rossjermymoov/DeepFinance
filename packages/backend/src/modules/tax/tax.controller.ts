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
import { TaxService } from './tax.service';
import { CreateTaxRateDto, UpdateTaxRateDto, TaxRateQueryDto } from './tax.dto';

@ApiTags('tax-rates')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('tax-rates')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  @ApiOperation({
    summary: 'List all tax rates',
    description: 'Get all tax rates for the entity, with optional filtering by active status',
  })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: TaxRateQueryDto,
  ) {
    return this.taxService.findAll(tenantId, entityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tax rate by ID' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.taxService.findById(tenantId, entityId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tax rate' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateTaxRateDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.taxService.create(tenantId, entityId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax rate' })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxRateDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.taxService.update(tenantId, entityId, id, dto, userId);
  }

  @Post('seed-uk/:entityId')
  @ApiOperation({
    summary: 'Seed UK default VAT rates',
    description: 'Create standard UK VAT rates (SR, RR, ZR, EX, NV) for this entity',
  })
  async seedUkDefaults(
    @Headers('x-tenant-id') tenantId: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.taxService.seedUkDefaults(tenantId, entityId, userId);
  }
}
