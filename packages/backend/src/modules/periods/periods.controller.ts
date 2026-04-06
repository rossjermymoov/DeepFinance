import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
import { PeriodsService } from './periods.service';
import { GeneratePeriodsDto } from './periods.dto';

@ApiTags('periods')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all financial periods' })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
  ) {
    return this.periodsService.findAll(tenantId, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a period by ID' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.periodsService.findById(tenantId, entityId, id);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate 12 monthly periods for a financial year',
    description:
      'Creates a full financial year (12 months) of periods starting from the given month and year.',
  })
  @ApiResponse({ status: 201, description: 'Periods created successfully' })
  async generateYearPeriods(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: GeneratePeriodsDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.periodsService.generateYearPeriods(
      tenantId,
      entityId,
      dto.startMonth,
      dto.startYear,
      userId,
    );
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close a period',
    description:
      'Prevents further posting to the period. Cannot close a locked period.',
  })
  async closePeriod(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.periodsService.closePeriod(tenantId, entityId, id, userId);
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lock a period',
    description:
      'Locks the period so only admins can post to it. Locked periods require special approval to reopen.',
  })
  async lockPeriod(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.periodsService.lockPeriod(tenantId, entityId, id, userId);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reopen a period',
    description:
      'Reopens a closed period for posting. Cannot reopen locked periods directly.',
  })
  async reopenPeriod(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.periodsService.reopenPeriod(tenantId, entityId, id);
  }
}
