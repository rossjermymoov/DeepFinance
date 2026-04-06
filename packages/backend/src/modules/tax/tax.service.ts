import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRate } from './tax-rate.entity';
import { CreateTaxRateDto, UpdateTaxRateDto, TaxRateQueryDto } from './tax.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxRate)
    private readonly taxRateRepo: Repository<TaxRate>,
  ) {}

  async findAll(
    tenantId: string,
    entityId: string,
    query?: TaxRateQueryDto,
  ): Promise<TaxRate[]> {
    const queryBuilder = this.taxRateRepo.createQueryBuilder('tax_rate')
      .where('tax_rate.tenantId = :tenantId', { tenantId })
      .andWhere('tax_rate.entityId = :entityId', { entityId });

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('tax_rate.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    return queryBuilder
      .orderBy('tax_rate.effectiveFrom', 'DESC')
      .addOrderBy('tax_rate.name', 'ASC')
      .getMany();
  }

  async findById(
    tenantId: string,
    entityId: string,
    id: string,
  ): Promise<TaxRate> {
    const taxRate = await this.taxRateRepo.findOne({
      where: { id, tenantId, entityId },
    });

    if (!taxRate) {
      throw new NotFoundException(`Tax rate ${id} not found`);
    }

    return taxRate;
  }

  async create(
    tenantId: string,
    entityId: string,
    dto: CreateTaxRateDto,
    userId: string,
  ): Promise<TaxRate> {
    // Validate unique code per tenant/entity
    const existing = await this.taxRateRepo.findOne({
      where: { tenantId, entityId, code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Tax rate code "${dto.code}" already exists for this entity`,
      );
    }

    // If setting as default, unset existing default
    if (dto.isDefault) {
      await this.taxRateRepo.update(
        { tenantId, entityId, isDefault: true },
        { isDefault: false },
      );
    }

    const taxRate = this.taxRateRepo.create({
      ...dto,
      tenantId,
      entityId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.taxRateRepo.save(taxRate);
  }

  async update(
    tenantId: string,
    entityId: string,
    id: string,
    dto: UpdateTaxRateDto,
    userId: string,
  ): Promise<TaxRate> {
    const taxRate = await this.findById(tenantId, entityId, id);

    // If setting as default, unset existing default
    if (dto.isDefault === true && !taxRate.isDefault) {
      await this.taxRateRepo.update(
        { tenantId, entityId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(taxRate, dto, { updatedBy: userId });
    return this.taxRateRepo.save(taxRate);
  }

  async seedUkDefaults(
    tenantId: string,
    entityId: string,
    userId: string,
  ): Promise<TaxRate[]> {
    const ukRates: CreateTaxRateDto[] = [
      {
        name: 'Standard Rate',
        code: 'SR',
        rate: 20.0,
        description: 'Standard VAT rate',
        isDefault: true,
        effectiveFrom: new Date().toISOString().split('T')[0],
      },
      {
        name: 'Reduced Rate',
        code: 'RR',
        rate: 5.0,
        description: 'Reduced VAT rate',
        isDefault: false,
        effectiveFrom: new Date().toISOString().split('T')[0],
      },
      {
        name: 'Zero Rate',
        code: 'ZR',
        rate: 0.0,
        description: 'Zero VAT rate',
        isDefault: false,
        effectiveFrom: new Date().toISOString().split('T')[0],
      },
      {
        name: 'Exempt',
        code: 'EX',
        rate: 0.0,
        description: 'Exempt from VAT',
        isDefault: false,
        effectiveFrom: new Date().toISOString().split('T')[0],
      },
      {
        name: 'No VAT',
        code: 'NV',
        rate: 0.0,
        description: 'No VAT applicable',
        isDefault: false,
        effectiveFrom: new Date().toISOString().split('T')[0],
      },
    ];

    const created: TaxRate[] = [];
    for (const rate of ukRates) {
      try {
        const taxRate = await this.create(tenantId, entityId, rate, userId);
        created.push(taxRate);
      } catch (error) {
        // Skip if already exists
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage && errorMessage.includes('already exists')) {
          continue;
        }
        throw error;
      }
    }

    return created;
  }
}
