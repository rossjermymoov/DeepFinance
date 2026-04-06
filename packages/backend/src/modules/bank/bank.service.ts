import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankTransaction } from './bank-transaction.entity';
import {
  CreateBankTransactionDto,
  ImportBankTransactionsDto,
  ReconcileTransactionDto,
  BankTransactionQueryDto,
  BankReconciliationSummaryDto,
} from './bank.dto';

@Injectable()
export class BankService {
  constructor(
    @InjectRepository(BankTransaction)
    private readonly bankTransactionRepo: Repository<BankTransaction>,
  ) {}

  async findAll(
    tenantId: string,
    entityId: string,
    query?: BankTransactionQueryDto,
  ): Promise<{ data: BankTransaction[]; total: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bankTransactionRepo.createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.entityId = :entityId', { entityId });

    if (query?.bankAccountId) {
      queryBuilder.andWhere('transaction.bankAccountId = :bankAccountId', {
        bankAccountId: query.bankAccountId,
      });
    }

    if (query?.reconciliationStatus) {
      queryBuilder.andWhere('transaction.reconciliationStatus = :reconciliationStatus', {
        reconciliationStatus: query.reconciliationStatus,
      });
    }

    if (query?.dateFrom) {
      queryBuilder.andWhere('transaction.transactionDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query?.dateTo) {
      queryBuilder.andWhere('transaction.transactionDate <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findById(
    tenantId: string,
    entityId: string,
    id: string,
  ): Promise<BankTransaction> {
    const transaction = await this.bankTransactionRepo.findOne({
      where: { id, tenantId, entityId },
    });

    if (!transaction) {
      throw new NotFoundException(`Bank transaction ${id} not found`);
    }

    return transaction;
  }

  async create(
    tenantId: string,
    entityId: string,
    dto: CreateBankTransactionDto,
    userId: string,
  ): Promise<BankTransaction> {
    const transaction = this.bankTransactionRepo.create({
      ...dto,
      tenantId,
      entityId,
      reconciliationStatus: 'UNRECONCILED',
      createdBy: userId,
      updatedBy: userId,
    });

    return this.bankTransactionRepo.save(transaction);
  }

  async importBatch(
    tenantId: string,
    entityId: string,
    dto: ImportBankTransactionsDto,
    userId: string,
  ): Promise<BankTransaction[]> {
    const importBatchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactions: BankTransaction[] = [];

    for (const item of dto.transactions) {
      const transaction = this.bankTransactionRepo.create({
        bankAccountId: dto.bankAccountId,
        transactionDate: item.transactionDate,
        description: item.description,
        reference: item.reference || null,
        amount: item.amount,
        type: item.type,
        tenantId,
        entityId,
        reconciliationStatus: 'UNRECONCILED',
        importSource: dto.importSource || null,
        importBatchId,
        createdBy: userId,
        updatedBy: userId,
      });

      transactions.push(transaction);
    }

    return this.bankTransactionRepo.save(transactions);
  }

  async reconcile(
    tenantId: string,
    entityId: string,
    id: string,
    dto: ReconcileTransactionDto,
    userId: string,
  ): Promise<BankTransaction> {
    const transaction = await this.findById(tenantId, entityId, id);

    transaction.reconciliationStatus = 'RECONCILED';
    transaction.matchedJournalId = dto.matchedJournalId;
    transaction.updatedBy = userId;

    return this.bankTransactionRepo.save(transaction);
  }

  async unreconcile(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<BankTransaction> {
    const transaction = await this.findById(tenantId, entityId, id);

    transaction.reconciliationStatus = 'UNRECONCILED';
    transaction.matchedJournalId = null;
    transaction.updatedBy = userId;

    return this.bankTransactionRepo.save(transaction);
  }

  async exclude(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<BankTransaction> {
    const transaction = await this.findById(tenantId, entityId, id);

    transaction.reconciliationStatus = 'EXCLUDED';
    transaction.updatedBy = userId;

    return this.bankTransactionRepo.save(transaction);
  }

  async getReconciliationSummary(
    tenantId: string,
    entityId: string,
    bankAccountId: string,
  ): Promise<BankReconciliationSummaryDto> {
    const queryBuilder = this.bankTransactionRepo.createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.entityId = :entityId', { entityId })
      .andWhere('transaction.bankAccountId = :bankAccountId', { bankAccountId });

    const counts = await queryBuilder
      .select('transaction.reconciliationStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(transaction.amount)', 'totalAmount')
      .groupBy('transaction.reconciliationStatus')
      .getRawMany();

    const countMap: Record<string, number> = {};
    const amountMap: Record<string, number> = {};

    for (const row of counts) {
      countMap[row.status] = parseInt(row.count, 10);
      amountMap[row.status] = parseFloat(row.totalAmount || 0);
    }

    const allTransactions = await queryBuilder.getMany();
    const totalAmount = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const unreconcilledAmount = allTransactions
      .filter((t) => t.reconciliationStatus === 'UNRECONCILED')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      unreconciled: countMap['UNRECONCILED'] || 0,
      matched: countMap['MATCHED'] || 0,
      reconciled: countMap['RECONCILED'] || 0,
      excluded: countMap['EXCLUDED'] || 0,
      unreconcilledAmount,
      totalAmount,
    };
  }
}
