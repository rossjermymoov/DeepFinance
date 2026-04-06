import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { Journal } from './journal.entity';
import { JournalLine } from './journal-line.entity';
import { Account } from '../accounts/account.entity';
import { PeriodsService } from '../periods/periods.service';
import { JournalStatus, JournalType } from '@deepfinance/shared';

// ================================================================
// MOCKS
// ================================================================

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const ENTITY_ID = '22222222-2222-2222-2222-222222222222';
const USER_ID = '33333333-3333-3333-3333-333333333333';
const PERIOD_ID = '44444444-4444-4444-4444-444444444444';
const ACCOUNT_BANK = '55555555-5555-5555-5555-555555555551';
const ACCOUNT_RENT = '55555555-5555-5555-5555-555555555552';
const ACCOUNT_VAT = '55555555-5555-5555-5555-555555555553';

const mockAccounts = new Map([
  [ACCOUNT_BANK, { id: ACCOUNT_BANK, code: '1200', name: 'Current Account', accountType: 'ASSET', isActive: true, isLocked: false, tenantId: TENANT_ID, entityId: ENTITY_ID }],
  [ACCOUNT_RENT, { id: ACCOUNT_RENT, code: '5001', name: 'Rent', accountType: 'EXPENSE', isActive: true, isLocked: false, tenantId: TENANT_ID, entityId: ENTITY_ID }],
  [ACCOUNT_VAT, { id: ACCOUNT_VAT, code: '2201', name: 'VAT Liability', accountType: 'LIABILITY', isActive: true, isLocked: false, tenantId: TENANT_ID, entityId: ENTITY_ID }],
]);

const mockPeriod = {
  id: PERIOD_ID,
  name: 'April 2026',
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  status: 'OPEN',
  tenantId: TENANT_ID,
  entityId: ENTITY_ID,
};

function createMockJournalRepo() {
  let journalCount = 0;
  return {
    create: jest.fn((data) => ({ ...data, id: `journal-${++journalCount}` })),
    save: jest.fn((journal) => Promise.resolve({ ...journal, id: journal.id || `journal-${++journalCount}` })),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };
}

function createMockLineRepo() {
  return {
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(null),
    })),
  };
}

function createMockAccountRepo() {
  return {
    find: jest.fn((opts) => {
      const results = [];
      for (const where of opts.where) {
        const account = mockAccounts.get(where.id);
        if (account) results.push(account);
      }
      return Promise.resolve(results);
    }),
  };
}

function createMockPeriodsService() {
  return {
    findPeriodForDate: jest.fn().mockResolvedValue(mockPeriod),
    validatePeriodForPosting: jest.fn().mockReturnValue({ allowed: true, warnings: [] }),
  };
}

function createMockDataSource() {
  return {
    transaction: jest.fn((fn) => fn({
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        create: jest.fn((data) => data),
        save: jest.fn((data) => Promise.resolve({ ...data, id: 'reversal-1' })),
      }),
    })),
  };
}

// ================================================================
// TESTS
// ================================================================

describe('JournalsService', () => {
  let service: JournalsService;
  let journalRepo: ReturnType<typeof createMockJournalRepo>;
  let periodsService: ReturnType<typeof createMockPeriodsService>;

  beforeEach(async () => {
    journalRepo = createMockJournalRepo();
    const lineRepo = createMockLineRepo();
    const accountRepo = createMockAccountRepo();
    periodsService = createMockPeriodsService();
    const dataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalsService,
        { provide: getRepositoryToken(Journal), useValue: journalRepo },
        { provide: getRepositoryToken(JournalLine), useValue: lineRepo },
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: PeriodsService, useValue: periodsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<JournalsService>(JournalsService);
  });

  // ================================================================
  // BALANCE VALIDATION
  // ================================================================

  describe('Balance validation (the fundamental rule)', () => {
    it('should reject a journal where debits do not equal credits', async () => {
      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Unbalanced journal',
          lines: [
            { accountId: ACCOUNT_RENT, debit: 1000, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 999 },
          ],
        }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a journal where debits do not equal credits (message includes difference)', async () => {
      try {
        await service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Unbalanced',
          lines: [
            { accountId: ACCOUNT_RENT, debit: 100.50, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 100.49 },
          ],
        }, USER_ID);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('0.01');
      }
    });

    it('should reject a zero-value journal', async () => {
      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Zero journal',
          lines: [
            { accountId: ACCOUNT_RENT, debit: 0, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 0 },
          ],
        }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle floating point precision correctly (e.g., 33.33 * 3)', async () => {
      // Three lines of 33.33 debit and one line of 99.99 credit
      // This tests that we use integer arithmetic, not floating point
      const result = await service.create(TENANT_ID, ENTITY_ID, {
        date: '2026-04-05',
        description: 'Precision test',
        lines: [
          { accountId: ACCOUNT_RENT, debit: 33.33, credit: 0 },
          { accountId: ACCOUNT_RENT, debit: 33.33, credit: 0 },
          { accountId: ACCOUNT_RENT, debit: 33.33, credit: 0 },
          { accountId: ACCOUNT_BANK, debit: 0, credit: 99.99 },
        ],
      }, USER_ID);

      expect(result).toBeDefined();
      expect(result.totalDebit).toBe(99.99);
      expect(result.totalCredit).toBe(99.99);
    });
  });

  // ================================================================
  // LINE VALIDATION
  // ================================================================

  describe('Line validation', () => {
    it('should reject a line with both debit and credit', async () => {
      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Both debit and credit',
          lines: [
            { accountId: ACCOUNT_RENT, debit: 100, credit: 50 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 50 },
          ],
        }, USER_ID),
      ).rejects.toThrow('cannot have both a debit and a credit');
    });

    it('should reject a line with zero debit and zero credit', async () => {
      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Zero line',
          lines: [
            { accountId: ACCOUNT_RENT, debit: 100, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 100 },
          ],
        }, USER_ID),
      ).rejects.toThrow('must have either a debit or a credit');
    });

    it('should reject negative amounts', async () => {
      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Negative',
          lines: [
            { accountId: ACCOUNT_RENT, debit: -100, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: -100 },
          ],
        }, USER_ID),
      ).rejects.toThrow('Negative amounts are not permitted');
    });
  });

  // ================================================================
  // ACCOUNT VALIDATION
  // ================================================================

  describe('Account validation', () => {
    it('should reject a journal with a non-existent account', async () => {
      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2026-04-05',
          description: 'Bad account',
          lines: [
            { accountId: 'non-existent-id-00000000000000000', debit: 100, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 100 },
          ],
        }, USER_ID),
      ).rejects.toThrow('not found');
    });
  });

  // ================================================================
  // SUCCESSFUL CREATION
  // ================================================================

  describe('Successful journal creation', () => {
    it('should create a balanced journal with DRAFT status', async () => {
      const result = await service.create(TENANT_ID, ENTITY_ID, {
        date: '2026-04-05',
        description: 'Office rent payment',
        reference: 'RENT-APR-26',
        lines: [
          { accountId: ACCOUNT_RENT, debit: 1000, credit: 0 },
          { accountId: ACCOUNT_BANK, debit: 0, credit: 1000 },
        ],
      }, USER_ID);

      expect(result).toBeDefined();
      expect(result.status).toBe(JournalStatus.DRAFT);
      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(1000);
      expect(result.lines).toHaveLength(2);
      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.entityId).toBe(ENTITY_ID);
      expect(result.periodId).toBe(PERIOD_ID);
    });

    it('should create a multi-line journal (e.g., rent + VAT)', async () => {
      const result = await service.create(TENANT_ID, ENTITY_ID, {
        date: '2026-04-05',
        description: 'Rent with VAT',
        lines: [
          { accountId: ACCOUNT_RENT, debit: 833.33, credit: 0 },
          { accountId: ACCOUNT_VAT, debit: 166.67, credit: 0 },
          { accountId: ACCOUNT_BANK, debit: 0, credit: 1000 },
        ],
      }, USER_ID);

      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(1000);
      expect(result.lines).toHaveLength(3);
    });

    it('should assign sequential journal numbers', async () => {
      const result = await service.create(TENANT_ID, ENTITY_ID, {
        date: '2026-04-05',
        description: 'First journal',
        lines: [
          { accountId: ACCOUNT_RENT, debit: 500, credit: 0 },
          { accountId: ACCOUNT_BANK, debit: 0, credit: 500 },
        ],
      }, USER_ID);

      expect(result.journalNumber).toMatch(/^JNL-\d{6}$/);
    });
  });

  // ================================================================
  // POSTING
  // ================================================================

  describe('Journal posting', () => {
    const draftJournal = {
      id: 'journal-1',
      tenantId: TENANT_ID,
      entityId: ENTITY_ID,
      journalNumber: 'JNL-000001',
      date: '2026-04-05',
      status: JournalStatus.DRAFT,
      totalDebit: 1000,
      totalCredit: 1000,
      lines: [
        { debit: 1000, credit: 0, accountId: ACCOUNT_RENT },
        { debit: 0, credit: 1000, accountId: ACCOUNT_BANK },
      ],
    };

    it('should post a DRAFT journal to an open period with no warnings', async () => {
      journalRepo.findOne.mockResolvedValue({ ...draftJournal });
      journalRepo.save.mockResolvedValue({ ...draftJournal, status: JournalStatus.POSTED });
      periodsService.validatePeriodForPosting.mockReturnValue({ allowed: true, warnings: [] });

      const result = await service.post(TENANT_ID, ENTITY_ID, 'journal-1', {}, USER_ID);

      expect(result.journal.status).toBe(JournalStatus.POSTED);
      expect(result.warnings).toEqual([]);
      expect(periodsService.validatePeriodForPosting).toHaveBeenCalledWith(mockPeriod, false);
    });

    it('should reject posting a journal that is already POSTED', async () => {
      journalRepo.findOne.mockResolvedValue({
        id: 'journal-1',
        status: JournalStatus.POSTED,
        journalNumber: 'JNL-000001',
        tenantId: TENANT_ID,
        entityId: ENTITY_ID,
      });

      await expect(
        service.post(TENANT_ID, ENTITY_ID, 'journal-1', {}, USER_ID),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject non-admin posting to a locked period (ForbiddenException)', async () => {
      journalRepo.findOne.mockResolvedValue({ ...draftJournal });

      periodsService.validatePeriodForPosting.mockImplementation((_period: any, isAdmin: boolean) => {
        if (!isAdmin) {
          throw new ForbiddenException('Only administrators can post to a locked period');
        }
        return { allowed: true, warnings: [] };
      });

      await expect(
        service.post(TENANT_ID, ENTITY_ID, 'journal-1', {}, USER_ID, false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to post to a locked period with a warning', async () => {
      journalRepo.findOne.mockResolvedValue({ ...draftJournal });
      journalRepo.save.mockResolvedValue({ ...draftJournal, status: JournalStatus.POSTED });

      const lockedWarning = 'WARNING: Financial period April 2026 is LOCKED. This journal is being posted under admin override.';
      periodsService.validatePeriodForPosting.mockReturnValue({
        allowed: true,
        warnings: [lockedWarning],
      });

      const result = await service.post(TENANT_ID, ENTITY_ID, 'journal-1', {}, USER_ID, true);

      expect(result.journal.status).toBe(JournalStatus.POSTED);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('LOCKED');
      expect(periodsService.validatePeriodForPosting).toHaveBeenCalledWith(mockPeriod, true);
    });

    it('should reject posting to a closed period (even for admins)', async () => {
      journalRepo.findOne.mockResolvedValue({ ...draftJournal });

      periodsService.validatePeriodForPosting.mockImplementation(() => {
        throw new BadRequestException('period is closed. Reopen the period before posting.');
      });

      await expect(
        service.post(TENANT_ID, ENTITY_ID, 'journal-1', {}, USER_ID, true),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ================================================================
  // PERIOD VALIDATION
  // ================================================================

  describe('Period validation', () => {
    it('should reject a journal when no period exists for the date', async () => {
      periodsService.findPeriodForDate.mockRejectedValue(
        new BadRequestException('No financial period found'),
      );

      await expect(
        service.create(TENANT_ID, ENTITY_ID, {
          date: '2025-01-01',
          description: 'Before any period',
          lines: [
            { accountId: ACCOUNT_RENT, debit: 100, credit: 0 },
            { accountId: ACCOUNT_BANK, debit: 0, credit: 100 },
          ],
        }, USER_ID),
      ).rejects.toThrow('No financial period found');
    });
  });

  // ================================================================
  // JOURNAL AMENDMENT (admin-only)
  // ================================================================

  describe('Journal amendment', () => {
    const postedJournal = {
      id: 'journal-posted-1',
      tenantId: TENANT_ID,
      entityId: ENTITY_ID,
      journalNumber: 'JNL-000010',
      date: '2026-04-05',
      status: JournalStatus.POSTED,
      type: 'STANDARD',
      description: 'Rent payment',
      reference: 'RENT-APR',
      currency: 'GBP',
      exchangeRate: null,
      totalDebit: 1000,
      totalCredit: 1000,
      isReversed: false,
      isAmended: false,
      lines: [
        { debit: 1000, credit: 0, accountId: ACCOUNT_RENT, description: 'Rent' },
        { debit: 0, credit: 1000, accountId: ACCOUNT_BANK, description: 'Bank' },
      ],
    };

    const amendDto = {
      reason: 'Wrong VAT rate applied',
      lines: [
        { accountId: ACCOUNT_RENT, debit: 833.33, credit: 0 },
        { accountId: ACCOUNT_VAT, debit: 166.67, credit: 0 },
        { accountId: ACCOUNT_BANK, debit: 0, credit: 1000 },
      ],
    };

    it('should reject amendment by a non-admin user (ForbiddenException)', async () => {
      await expect(
        service.amend(TENANT_ID, ENTITY_ID, 'journal-posted-1', amendDto, USER_ID, false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should amend a posted journal as admin — original goes AMENDED, new journal is POSTED', async () => {
      // The mock DataSource.transaction needs to simulate both findOne and save
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue({ ...postedJournal }),
        create: jest.fn((data: any) => ({ ...data, id: 'amendment-1' })),
        save: jest.fn((data: any) => Promise.resolve({ ...data, id: data.id || 'amendment-1' })),
      };

      const dataSource = {
        transaction: jest.fn((fn: any) => fn({
          getRepository: jest.fn().mockReturnValue(mockTxRepo),
        })),
      };

      // Rebuild the service with this mock DataSource
      const module = await Test.createTestingModule({
        providers: [
          JournalsService,
          { provide: getRepositoryToken(Journal), useValue: journalRepo },
          { provide: getRepositoryToken(JournalLine), useValue: createMockLineRepo() },
          { provide: getRepositoryToken(Account), useValue: createMockAccountRepo() },
          { provide: PeriodsService, useValue: periodsService },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();
      const svc = module.get<JournalsService>(JournalsService);

      periodsService.validatePeriodForPosting.mockReturnValue({ allowed: true, warnings: [] });

      const result = await svc.amend(TENANT_ID, ENTITY_ID, 'journal-posted-1', amendDto, USER_ID, true);

      // Original should be marked AMENDED
      expect(result.original.status).toBe(JournalStatus.AMENDED);
      expect(result.original.isAmended).toBe(true);

      // Amendment journal should be POSTED with type AMENDMENT
      expect(result.amendment.status).toBe(JournalStatus.POSTED);
      expect(result.amendment.type).toBe('AMENDMENT');
      expect(result.amendment.amendsJournalId).toBe('journal-posted-1');
      expect(result.amendment.amendmentReason).toBe('Wrong VAT rate applied');

      // Should include informational warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: string) => w.includes('AMENDED'))).toBe(true);
    });

    it('should reject amending a DRAFT journal', async () => {
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue({
          ...postedJournal,
          status: JournalStatus.DRAFT,
        }),
        create: jest.fn(),
        save: jest.fn(),
      };

      const dataSource = {
        transaction: jest.fn((fn: any) => fn({
          getRepository: jest.fn().mockReturnValue(mockTxRepo),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          JournalsService,
          { provide: getRepositoryToken(Journal), useValue: journalRepo },
          { provide: getRepositoryToken(JournalLine), useValue: createMockLineRepo() },
          { provide: getRepositoryToken(Account), useValue: createMockAccountRepo() },
          { provide: PeriodsService, useValue: periodsService },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();
      const svc = module.get<JournalsService>(JournalsService);

      await expect(
        svc.amend(TENANT_ID, ENTITY_ID, 'journal-posted-1', amendDto, USER_ID, true),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject amending a journal that has already been amended', async () => {
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue({
          ...postedJournal,
          isAmended: true,
        }),
        create: jest.fn(),
        save: jest.fn(),
      };

      const dataSource = {
        transaction: jest.fn((fn: any) => fn({
          getRepository: jest.fn().mockReturnValue(mockTxRepo),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          JournalsService,
          { provide: getRepositoryToken(Journal), useValue: journalRepo },
          { provide: getRepositoryToken(JournalLine), useValue: createMockLineRepo() },
          { provide: getRepositoryToken(Account), useValue: createMockAccountRepo() },
          { provide: PeriodsService, useValue: periodsService },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();
      const svc = module.get<JournalsService>(JournalsService);

      await expect(
        svc.amend(TENANT_ID, ENTITY_ID, 'journal-posted-1', amendDto, USER_ID, true),
      ).rejects.toThrow('already been amended');
    });

    it('should reject amending a reversed journal', async () => {
      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue({
          ...postedJournal,
          isReversed: true,
        }),
        create: jest.fn(),
        save: jest.fn(),
      };

      const dataSource = {
        transaction: jest.fn((fn: any) => fn({
          getRepository: jest.fn().mockReturnValue(mockTxRepo),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          JournalsService,
          { provide: getRepositoryToken(Journal), useValue: journalRepo },
          { provide: getRepositoryToken(JournalLine), useValue: createMockLineRepo() },
          { provide: getRepositoryToken(Account), useValue: createMockAccountRepo() },
          { provide: PeriodsService, useValue: periodsService },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();
      const svc = module.get<JournalsService>(JournalsService);

      await expect(
        svc.amend(TENANT_ID, ENTITY_ID, 'journal-posted-1', amendDto, USER_ID, true),
      ).rejects.toThrow('Reversed journals cannot be amended');
    });

    it('should validate balance on the amended lines', async () => {
      const unbalancedDto = {
        reason: 'Correction',
        lines: [
          { accountId: ACCOUNT_RENT, debit: 500, credit: 0 },
          { accountId: ACCOUNT_BANK, debit: 0, credit: 499 },
        ],
      };

      const mockTxRepo = {
        findOne: jest.fn().mockResolvedValue({ ...postedJournal }),
        create: jest.fn(),
        save: jest.fn(),
      };

      const dataSource = {
        transaction: jest.fn((fn: any) => fn({
          getRepository: jest.fn().mockReturnValue(mockTxRepo),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          JournalsService,
          { provide: getRepositoryToken(Journal), useValue: journalRepo },
          { provide: getRepositoryToken(JournalLine), useValue: createMockLineRepo() },
          { provide: getRepositoryToken(Account), useValue: createMockAccountRepo() },
          { provide: PeriodsService, useValue: periodsService },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();
      const svc = module.get<JournalsService>(JournalsService);

      await expect(
        svc.amend(TENANT_ID, ENTITY_ID, 'journal-posted-1', unbalancedDto, USER_ID, true),
      ).rejects.toThrow('does not balance');
    });
  });
});
