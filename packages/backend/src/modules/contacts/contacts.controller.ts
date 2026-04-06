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
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ContactQueryDto } from './contacts.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@ApiHeader({ name: 'x-entity-id', required: true })
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all contacts with optional filtering',
    description: 'Supports filtering by type, search, and active status',
  })
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Query() query: ContactQueryDto,
  ) {
    return this.contactsService.findAll(tenantId, entityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID' })
  async findById(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactsService.findById(tenantId, entityId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Body() dto: CreateContactDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.contactsService.create(tenantId, entityId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-entity-id') entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const userId = '00000000-0000-0000-0000-000000000000';
    return this.contactsService.update(tenantId, entityId, id, dto, userId);
  }
}
