import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async findAll(tenantId: string, entityId: string): Promise<Account[]> {
    return this.accountRepo.find({
      where: { tenantId, entityId },
      order: { accountType: 'ASC', code: 'ASC' },
    });
  }

  async findById(tenantId: string, entityId: string, id: string): Promise<Account> {
    const account = await this.accountRepo.findOne({
      where: { id, tenantId, entityId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }

  async findByCode(tenantId: string, entityId: string, code: string): Promise<Account | null> {
    return this.accountRepo.findOne({
      where: { tenantId, entityId, code },
    });
  }

  async create(tenantId: string, entityId: string, dto: CreateAccountDto, userId: string): Promise<Account> {
    // Check for duplicate code
    const existing = await this.findByCode(tenantId, entityId, dto.code);
    if (existing) {
      throw new ConflictException(`Account code ${dto.code} already exists`);
    }

    const account = this.accountRepo.create({
      ...dto,
      tenantId,
      entityId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.accountRepo.save(account);
  }

  async update(
    tenantId: string,
    entityId: string,
    id: string,
    dto: UpdateAccountDto,
    userId: string,
  ): Promise<Account> {
    const account = await this.findById(tenantId, entityId, id);

    if (account.isSystemAccount && dto.isActive === false) {
      throw new ConflictException('System accounts cannot be deactivated');
    }

    Object.assign(account, dto, { updatedBy: userId });
    return this.accountRepo.save(account);
  }

  async getTrialBalance(tenantId: string, entityId: string): Promise<{
    accounts: Array<{
      id: string;
      code: string;
      name: string;
      accountType: string;
      debit: number;
      credit: number;
    }>;
    totalDebit: number;
    totalCredit: number;
  }> {
    // This will be expanded with actual journal aggregation
    // For now, return the account structure
    const accounts = await this.findAll(tenantId, entityId);

    return {
      accounts: accounts.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        accountType: a.accountType,
        debit: 0,
        credit: 0,
      })),
      totalDebit: 0,
      totalCredit: 0,
    };
  }
}
