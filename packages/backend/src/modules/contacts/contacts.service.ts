import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto, UpdateContactDto, ContactQueryDto } from './contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async findAll(
    tenantId: string,
    entityId: string,
    query?: ContactQueryDto,
  ): Promise<Contact[]> {
    const queryBuilder = this.contactRepo.createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId })
      .andWhere('contact.entityId = :entityId', { entityId });

    if (query?.contactType) {
      queryBuilder.andWhere('contact.contactType = :contactType', {
        contactType: query.contactType,
      });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(contact.name ILIKE :search OR contact.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('contact.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    return queryBuilder.orderBy('contact.name', 'ASC').getMany();
  }

  async findById(
    tenantId: string,
    entityId: string,
    id: string,
  ): Promise<Contact> {
    const contact = await this.contactRepo.findOne({
      where: { id, tenantId, entityId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }

    return contact;
  }

  async create(
    tenantId: string,
    entityId: string,
    dto: CreateContactDto,
    userId: string,
  ): Promise<Contact> {
    const contact = this.contactRepo.create({
      ...dto,
      tenantId,
      entityId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.contactRepo.save(contact);
  }

  async update(
    tenantId: string,
    entityId: string,
    id: string,
    dto: UpdateContactDto,
    userId: string,
  ): Promise<Contact> {
    const contact = await this.findById(tenantId, entityId, id);

    Object.assign(contact, dto, { updatedBy: userId });
    return this.contactRepo.save(contact);
  }

  async toggleActive(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<Contact> {
    const contact = await this.findById(tenantId, entityId, id);
    contact.isActive = !contact.isActive;
    contact.updatedBy = userId;

    return this.contactRepo.save(contact);
  }
}
