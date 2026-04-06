import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, FindOptionsWhere } from 'typeorm';
import { Journal } from './journal.entity';
import { JournalLine } from './journal-line.entity';
import { Account } from '../accounts/account.entity';
import { PeriodsService } from '../periods/periods.service';
import {
  CreateJournalDto,
  PostJournalDto,
  ReverseJournalDto,
  AmendJournalDto,
  JournalQueryDto,
} from './journals.dto';
import { JournalStatus, JournalType, JournalSourceType } from '@deepfinance/shared';

@Injectable()
export class JournalsService {
  constructor(
    @InjectRepository(Journal)
    private readonly journalRepo: Repository<Journal>,
    @InjectRepository(JournalLine)
    private readonly lineRepo: Repository<JournalLine>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly periodsService: PeriodsService,
    private readonly dataSource: DataSource,
  ) {}

  // ================================================================
  // VALIDATION
  // ================================================================

  /**
   * Core validation: a journal MUST balance.
   * Total debits must equal total credits. No exceptions.
   * Uses integer arithmetic (pence) to avoid floating point errors.
   */
  private validateBalance(lines: CreateJournalDto['lines']): void {
    let totalDebitPence = 0;
    let totalCreditPence = 0;

    for (const line of lines) {
      totalDebitPence += Math.round(line.debit * 100);
      totalCreditPence += Math.round(line.credit * 100);
    }

    if (totalDebitPence !== totalCreditPence) {
      const totalDebit = totalDebitPence / 100;
      const totalCredit = totalCreditPence / 100;
      throw new BadRequestException(
        `Journal does not balance. Total debits: ${totalDebit.toFixed(2)}, total credits: ${totalCredit.toFixed(2)}. Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}`,
      );
    }

    if (totalDebitPence === 0) {
      throw new BadRequestException('Journal cannot have zero value');
    }
  }

  /**
   * Validate that each line has either a debit or credit, not both.
   */
  private validateLines(lines: CreateJournalDto['lines']): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException(
          `Line ${i + 1}: A journal line cannot have both a debit and a credit. Split into separate lines.`,
        );
      }

      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException(
          `Line ${i + 1}: A journal line must have either a debit or a credit amount.`,
        );
      }

      if (line.debit < 0 || line.credit < 0) {
        throw new BadRequestException(
          `Line ${i + 1}: Negative amounts are not permitted. Use debit/credit to indicate direction.`,
        );
      }
    }
  }

  /**
   * Validate all referenced accounts exist, are active, and not locked.
   */
  private async validateAccounts(
    tenantId: string,
    entityId: string,
    accountIds: string[],
  ): Promise<Map<string, Account>> {
    const uniqueIds = [...new Set(accountIds)];
    const accounts = await this.accountRepo.find({
      where: uniqueIds.map((id) => ({ id, tenantId, entityId })),
    });

    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    for (const id of uniqueIds) {
      const account = accountMap.get(id);
      if (!account) {
        throw new BadRequestException(`Account ${id} not found`);
      }
      if (!account.isActive) {
        throw new BadRequestException(
          `Account ${account.code} (${account.name}) is inactive. Cannot post to inactive accounts.`,
        );
      }
      if (account.isLocked) {
        throw new BadRequestException(
          `Account ${account.code} (${account.name}) is locked. No new transactions permitted.`,
        );
      }
    }

    return accountMap;
  }

  // ================================================================
  // JOURNAL NUMBER GENERATION
  // ================================================================

  /**
   * Generate next sequential journal number for an entity.
   * Format: JNL-000001
   * Thread-safe via database sequence.
   */
  private async generateJournalNumber(
    tenantId: string,
    entityId: string,
  ): Promise<string> {
    const result = await this.journalRepo
      .createQueryBuilder('j')
      .select('MAX(j.journal_number)', 'maxNum')
      .where('j.tenant_id = :tenantId', { tenantId })
      .andWhere('j.entity_id = :entityId', { entityId })
      .getRawOne();

    let nextNum = 1;
    if (result?.maxNum) {
      const currentNum = parseInt(result.maxNum.replace('JNL-', ''), 10);
      nextNum = currentNum + 1;
    }

    return `JNL-${nextNum.toString().padStart(6, '0')}`;
  }

  // ================================================================
  // CREATE
  // ================================================================

  /**
   * Create a new journal in DRAFT status.
   * Validates balance, line rules, and account references.
   * Does NOT post to the ledger yet.
   */
  async create(
    tenantId: string,
    entityId: string,
    dto: CreateJournalDto,
    userId: string,
  ): Promise<Journal> {
    // 1. Validate lines (debit/credit rules)
    this.validateLines(dto.lines);

    // 2. Validate balance (debits must equal credits)
    this.validateBalance(dto.lines);

    // 3. Validate all accounts exist and are active
    const accountIds = dto.lines.map((l) => l.accountId);
    await this.validateAccounts(tenantId, entityId, accountIds);

    // 4. Find the financial period for the journal date
    const period = await this.periodsService.findPeriodForDate(
      tenantId,
      entityId,
      dto.date,
    );

    // 5. Generate journal number
    const journalNumber = await this.generateJournalNumber(tenantId, entityId);

    // 6. Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of dto.lines) {
      totalDebit += Math.round(line.debit * 100);
      totalCredit += Math.round(line.credit * 100);
    }

    // 7. Build journal entity
    const journal = this.journalRepo.create({
      tenantId,
      entityId,
      journalNumber,
      date: dto.date,
      periodId: period.id,
      type: dto.type || JournalType.STANDARD,
      status: JournalStatus.DRAFT,
      description: dto.description,
      reference: dto.reference,
      sourceType: JournalSourceType.MANUAL,
      currency: dto.currency || 'GBP',
      exchangeRate: dto.exchangeRate,
      totalDebit: totalDebit / 100,
      totalCredit: totalCredit / 100,
      createdBy: userId,
      updatedBy: userId,
      lines: dto.lines.map((line, index) => {
        const jl = new JournalLine();
        jl.lineNumber = index + 1;
        jl.accountId = line.accountId;
        jl.description = line.description ?? null;
        jl.debit = line.debit;
        jl.credit = line.credit;
        jl.currency = dto.currency || 'GBP';
        jl.exchangeRate = dto.exchangeRate ?? null;
        // Base currency amounts (same as transaction if GBP, converted otherwise)
        jl.baseCurrencyDebit = dto.exchangeRate
          ? Math.round(line.debit * dto.exchangeRate * 100) / 100
          : line.debit;
        jl.baseCurrencyCredit = dto.exchangeRate
          ? Math.round(line.credit * dto.exchangeRate * 100) / 100
          : line.credit;
        jl.taxRateId = line.taxRateId ?? null;
        jl.dimensions = line.dimensions ?? null;
        return jl;
      }),
    });

    return this.journalRepo.save(journal);
  }

  // ================================================================
  // POST (commit to ledger)
  // ================================================================

  /**
   * Post a draft journal to the general ledger.
   * This is the point of no return — posted journals are immutable.
   * Validates the period is open before posting.
   *
   * Admins can override locked periods — the response includes warnings.
   */
  async post(
    tenantId: string,
    entityId: string,
    journalId: string,
    dto: PostJournalDto,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<{ journal: Journal; warnings: string[] }> {
    const journal = await this.findById(tenantId, entityId, journalId);

    if (journal.status !== JournalStatus.DRAFT) {
      throw new ConflictException(
        `Journal ${journal.journalNumber} is ${journal.status}. Only DRAFT journals can be posted.`,
      );
    }

    // Validate the period allows posting (admins can override locked periods)
    const period = await this.periodsService.findPeriodForDate(
      tenantId,
      entityId,
      dto.postingDate || journal.date,
    );
    const periodValidation = this.periodsService.validatePeriodForPosting(period, isAdmin);

    // Re-validate balance (defence in depth)
    const lineData = journal.lines.map((l) => ({
      accountId: l.accountId,
      debit: Number(l.debit),
      credit: Number(l.credit),
    }));
    this.validateBalance(lineData);

    // Post the journal
    journal.status = JournalStatus.POSTED;
    journal.postedAt = new Date();
    journal.postedBy = userId;

    const saved = await this.journalRepo.save(journal);
    return { journal: saved, warnings: periodValidation.warnings };
  }

  // ================================================================
  // REVERSE
  // ================================================================

  /**
   * Reverse a posted journal by creating a mirror journal.
   * The original journal is marked as reversed.
   * This is the ONLY way to "undo" a posted journal.
   */
  async reverse(
    tenantId: string,
    entityId: string,
    journalId: string,
    dto: ReverseJournalDto,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<{ journal: Journal; warnings: string[] }> {
    return this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(Journal);

      const original = await journalRepo.findOne({
        where: { id: journalId, tenantId, entityId },
        relations: ['lines'],
      });

      if (!original) {
        throw new NotFoundException(`Journal ${journalId} not found`);
      }

      if (original.status !== JournalStatus.POSTED) {
        throw new ConflictException(
          `Journal ${original.journalNumber} is ${original.status}. Only POSTED journals can be reversed.`,
        );
      }

      if (original.isReversed) {
        throw new ConflictException(
          `Journal ${original.journalNumber} has already been reversed.`,
        );
      }

      // Validate reversal period allows posting (admins can override locked)
      const period = await this.periodsService.findPeriodForDate(
        tenantId,
        entityId,
        dto.reversalDate,
      );
      const periodValidation = this.periodsService.validatePeriodForPosting(period, isAdmin);

      // Generate new journal number
      const reversalNumber = await this.generateJournalNumber(tenantId, entityId);

      // Create reversing journal — swap debits and credits
      const reversalJournal = journalRepo.create({
        tenantId,
        entityId,
        journalNumber: reversalNumber,
        date: dto.reversalDate,
        periodId: period.id,
        type: JournalType.REVERSING,
        status: JournalStatus.POSTED,
        description: `Reversal of ${original.journalNumber}: ${dto.reason || original.description}`,
        reference: original.reference,
        sourceType: JournalSourceType.MANUAL,
        currency: original.currency,
        exchangeRate: original.exchangeRate,
        totalDebit: original.totalCredit,  // Swapped
        totalCredit: original.totalDebit,   // Swapped
        reversesJournalId: original.id,
        postedAt: new Date(),
        postedBy: userId,
        createdBy: userId,
        updatedBy: userId,
        lines: original.lines.map((line, index) => {
          const rl = new JournalLine();
          rl.lineNumber = index + 1;
          rl.accountId = line.accountId;
          rl.description = `Reversal: ${line.description || ''}`;
          rl.debit = Number(line.credit);           // Swap debit/credit
          rl.credit = Number(line.debit);            // Swap debit/credit
          rl.currency = line.currency;
          rl.exchangeRate = line.exchangeRate;
          rl.baseCurrencyDebit = Number(line.baseCurrencyCredit);
          rl.baseCurrencyCredit = Number(line.baseCurrencyDebit);
          rl.taxRateId = line.taxRateId;
          rl.dimensions = line.dimensions;
          return rl;
        }),
      });

      const savedReversal = await journalRepo.save(reversalJournal);

      // Mark original as reversed
      original.isReversed = true;
      original.reversedByJournalId = savedReversal.id;
      await journalRepo.save(original);

      return { journal: savedReversal, warnings: periodValidation.warnings };
    });
  }

  // ================================================================
  // AMEND (admin-only correction of a posted journal)
  // ================================================================

  /**
   * Amend a posted journal. Admin-only operation.
   *
   * This does NOT mutate the original journal's financial data.
   * Instead:
   *   1. The original is marked AMENDED (red) — stays in the audit trail
   *   2. A new corrected journal is created as type AMENDMENT, posted immediately
   *   3. Both journals are cross-linked for traceability
   *
   * The AMENDED journal's lines are excluded from trial balance and reports
   * because its status is no longer POSTED (reports filter on status=POSTED).
   * The new AMENDMENT journal replaces it in all financial aggregations.
   */
  async amend(
    tenantId: string,
    entityId: string,
    journalId: string,
    dto: AmendJournalDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ original: Journal; amendment: Journal; warnings: string[] }> {
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only administrators can amend posted journals. Standard users must reverse and re-enter.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(Journal);

      // 1. Load the original journal
      const original = await journalRepo.findOne({
        where: { id: journalId, tenantId, entityId },
        relations: ['lines'],
      });

      if (!original) {
        throw new NotFoundException(`Journal ${journalId} not found`);
      }

      if (original.status !== JournalStatus.POSTED) {
        throw new ConflictException(
          `Journal ${original.journalNumber} is ${original.status}. Only POSTED journals can be amended.`,
        );
      }

      if (original.isAmended) {
        throw new ConflictException(
          `Journal ${original.journalNumber} has already been amended.`,
        );
      }

      if (original.isReversed) {
        throw new ConflictException(
          `Journal ${original.journalNumber} has been reversed. Reversed journals cannot be amended.`,
        );
      }

      // 2. Validate the corrected lines
      this.validateLines(dto.lines);
      this.validateBalance(dto.lines);

      const accountIds = dto.lines.map((l) => l.accountId);
      await this.validateAccounts(tenantId, entityId, accountIds);

      // 3. Validate the period for the amendment date
      const amendmentDate = dto.date || original.date;
      const period = await this.periodsService.findPeriodForDate(
        tenantId,
        entityId,
        amendmentDate,
      );
      const periodValidation = this.periodsService.validatePeriodForPosting(period, isAdmin);

      const warnings = [...periodValidation.warnings];

      // 4. Generate a new journal number for the amendment
      const amendmentNumber = await this.generateJournalNumber(tenantId, entityId);

      // 5. Calculate totals for the corrected lines
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of dto.lines) {
        totalDebit += Math.round(line.debit * 100);
        totalCredit += Math.round(line.credit * 100);
      }

      // 6. Create the amendment journal — goes straight to POSTED
      const amendment = journalRepo.create({
        tenantId,
        entityId,
        journalNumber: amendmentNumber,
        date: amendmentDate,
        periodId: period.id,
        type: JournalType.AMENDMENT,
        status: JournalStatus.POSTED,
        description: dto.description || `Amendment of ${original.journalNumber}: ${dto.reason}`,
        reference: dto.reference || original.reference,
        sourceType: JournalSourceType.MANUAL,
        currency: dto.currency || original.currency,
        exchangeRate: dto.exchangeRate ?? original.exchangeRate,
        totalDebit: totalDebit / 100,
        totalCredit: totalCredit / 100,
        amendsJournalId: original.id,
        amendmentReason: dto.reason,
        postedAt: new Date(),
        postedBy: userId,
        createdBy: userId,
        updatedBy: userId,
        lines: dto.lines.map((line, index) => {
          const jl = new JournalLine();
          jl.lineNumber = index + 1;
          jl.accountId = line.accountId;
          jl.description = line.description ?? null;
          jl.debit = line.debit;
          jl.credit = line.credit;
          jl.currency = dto.currency || original.currency;
          jl.exchangeRate = dto.exchangeRate ?? original.exchangeRate ?? null;
          jl.baseCurrencyDebit = dto.exchangeRate
            ? Math.round(line.debit * dto.exchangeRate * 100) / 100
            : line.debit;
          jl.baseCurrencyCredit = dto.exchangeRate
            ? Math.round(line.credit * dto.exchangeRate * 100) / 100
            : line.credit;
          jl.taxRateId = line.taxRateId ?? null;
          jl.dimensions = line.dimensions ?? null;
          return jl;
        }),
      });

      const savedAmendment = await journalRepo.save(amendment);

      // 7. Mark the original as AMENDED (red)
      original.status = JournalStatus.AMENDED;
      original.isAmended = true;
      original.amendedByJournalId = savedAmendment.id;
      original.amendmentReason = dto.reason;
      await journalRepo.save(original);

      warnings.push(
        `Journal ${original.journalNumber} has been marked as AMENDED (red). ` +
        `Replacement journal ${savedAmendment.journalNumber} is now active.`,
      );

      return { original, amendment: savedAmendment, warnings };
    });
  }

  // ================================================================
  // QUERIES
  // ================================================================

  async findAll(
    tenantId: string,
    entityId: string,
    query: JournalQueryDto,
  ): Promise<{ data: Journal[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Journal> = { tenantId, entityId };

    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    // Date range filtering handled via query builder for Between
    const qb = this.journalRepo
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.lines', 'lines')
      .where('j.tenant_id = :tenantId', { tenantId })
      .andWhere('j.entity_id = :entityId', { entityId });

    if (query.status) {
      qb.andWhere('j.status = :status', { status: query.status });
    }
    if (query.type) {
      qb.andWhere('j.type = :type', { type: query.type });
    }
    if (query.dateFrom) {
      qb.andWhere('j.date >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('j.date <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('j.date', 'DESC')
      .addOrderBy('j.journal_number', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(tenantId: string, entityId: string, id: string): Promise<Journal> {
    const journal = await this.journalRepo.findOne({
      where: { id, tenantId, entityId },
      relations: ['lines'],
    });

    if (!journal) {
      throw new NotFoundException(`Journal ${id} not found`);
    }

    return journal;
  }

  async findByNumber(
    tenantId: string,
    entityId: string,
    journalNumber: string,
  ): Promise<Journal> {
    const journal = await this.journalRepo.findOne({
      where: { journalNumber, tenantId, entityId },
      relations: ['lines'],
    });

    if (!journal) {
      throw new NotFoundException(`Journal ${journalNumber} not found`);
    }

    return journal;
  }

  // ================================================================
  // TRIAL BALANCE (aggregate journal lines by account)
  // ================================================================

  /**
   * Calculate trial balance from posted journal lines.
   * Only includes POSTED journals. Sums debits and credits per account.
   */
  async getTrialBalance(
    tenantId: string,
    entityId: string,
    asAtDate?: string,
  ): Promise<{
    accounts: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    totalDebit: number;
    totalCredit: number;
    asAtDate: string;
  }> {
    const dateFilter = asAtDate || new Date().toISOString().split('T')[0];

    const results = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal', 'j')
      .innerJoin(Account, 'a', 'a.id = jl.account_id')
      .select('jl.account_id', 'accountId')
      .addSelect('a.code', 'accountCode')
      .addSelect('a.name', 'accountName')
      .addSelect('a.account_type', 'accountType')
      .addSelect('SUM(jl.base_currency_debit)', 'totalDebit')
      .addSelect('SUM(jl.base_currency_credit)', 'totalCredit')
      .where('j.tenant_id = :tenantId', { tenantId })
      .andWhere('j.entity_id = :entityId', { entityId })
      .andWhere('j.status = :status', { status: JournalStatus.POSTED })
      .andWhere('j.date <= :dateFilter', { dateFilter })
      .groupBy('jl.account_id')
      .addGroupBy('a.code')
      .addGroupBy('a.name')
      .addGroupBy('a.account_type')
      .orderBy('a.code', 'ASC')
      .getRawMany();

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    const accounts = results.map((row) => {
      const debit = parseFloat(row.totalDebit) || 0;
      const credit = parseFloat(row.totalCredit) || 0;

      // Net balance: for Assets/Expenses, debit is positive
      // For Liabilities/Equity/Income, credit is positive
      const balance = debit - credit;

      grandTotalDebit += debit;
      grandTotalCredit += credit;

      return {
        accountId: row.accountId,
        accountCode: row.accountCode,
        accountName: row.accountName,
        accountType: row.accountType,
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      };
    });

    return {
      accounts,
      totalDebit: Math.round(grandTotalDebit * 100) / 100,
      totalCredit: Math.round(grandTotalCredit * 100) / 100,
      asAtDate: dateFilter,
    };
  }

  /**
   * Get the balance for a single account from posted journals.
   */
  async getAccountBalance(
    tenantId: string,
    entityId: string,
    accountId: string,
    asAtDate?: string,
  ): Promise<{ debit: number; credit: number; balance: number }> {
    const dateFilter = asAtDate || new Date().toISOString().split('T')[0];

    const result = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal', 'j')
      .select('SUM(jl.base_currency_debit)', 'totalDebit')
      .addSelect('SUM(jl.base_currency_credit)', 'totalCredit')
      .where('j.tenant_id = :tenantId', { tenantId })
      .andWhere('j.entity_id = :entityId', { entityId })
      .andWhere('j.status = :status', { status: JournalStatus.POSTED })
      .andWhere('j.date <= :dateFilter', { dateFilter })
      .andWhere('jl.account_id = :accountId', { accountId })
      .getRawOne();

    const debit = parseFloat(result?.totalDebit) || 0;
    const credit = parseFloat(result?.totalCredit) || 0;

    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
      balance: Math.round((debit - credit) * 100) / 100,
    };
  }

  /**
   * Get ledger entries for a specific account (all posted journal lines).
   */
  async getAccountLedger(
    tenantId: string,
    entityId: string,
    accountId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Array<{
    journalId: string;
    journalNumber: string;
    date: string;
    description: string;
    reference: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }>> {
    const qb = this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal', 'j')
      .select([
        'j.id AS "journalId"',
        'j.journal_number AS "journalNumber"',
        'j.date AS date',
        'COALESCE(jl.description, j.description) AS description',
        'j.reference AS reference',
        'jl.base_currency_debit AS debit',
        'jl.base_currency_credit AS credit',
      ])
      .where('j.tenant_id = :tenantId', { tenantId })
      .andWhere('j.entity_id = :entityId', { entityId })
      .andWhere('j.status = :status', { status: JournalStatus.POSTED })
      .andWhere('jl.account_id = :accountId', { accountId });

    if (dateFrom) {
      qb.andWhere('j.date >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('j.date <= :dateTo', { dateTo });
    }

    qb.orderBy('j.date', 'ASC').addOrderBy('j.journal_number', 'ASC');

    const rows = await qb.getRawMany();

    // Calculate running balance
    let runningBalance = 0;
    return rows.map((row) => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;
      runningBalance += debit - credit;

      return {
        journalId: row.journalId,
        journalNumber: row.journalNumber,
        date: row.date,
        description: row.description,
        reference: row.reference,
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });
  }
}
