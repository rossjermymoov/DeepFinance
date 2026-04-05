import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FinancialPeriod } from './financial-period.entity';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(FinancialPeriod)
    private readonly periodRepo: Repository<FinancialPeriod>,
  ) {}

  /**
   * Find the financial period that contains a given date.
   * Throws if no period exists or if the period is locked.
   */
  async findPeriodForDate(
    tenantId: string,
    entityId: string,
    date: string,
  ): Promise<FinancialPeriod> {
    const period = await this.periodRepo.findOne({
      where: {
        tenantId,
        entityId,
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      },
    });

    if (!period) {
      throw new BadRequestException(
        `No financial period found for date ${date}. Create financial periods before posting journals.`,
      );
    }

    return period;
  }

  /**
   * Check if a period allows posting.
   */
  validatePeriodForPosting(period: FinancialPeriod): void {
    if (period.status === 'LOCKED') {
      throw new BadRequestException(
        `Financial period ${period.name} is locked. No journals can be posted to a locked period.`,
      );
    }
    if (period.status === 'CLOSED') {
      throw new BadRequestException(
        `Financial period ${period.name} is closed. Reopen the period before posting.`,
      );
    }
  }

  async findAll(tenantId: string, entityId: string): Promise<FinancialPeriod[]> {
    return this.periodRepo.find({
      where: { tenantId, entityId },
      order: { startDate: 'ASC' },
    });
  }

  async findById(tenantId: string, entityId: string, id: string): Promise<FinancialPeriod> {
    const period = await this.periodRepo.findOne({
      where: { id, tenantId, entityId },
    });
    if (!period) {
      throw new NotFoundException(`Financial period ${id} not found`);
    }
    return period;
  }

  /**
   * Generate monthly periods for a financial year.
   * @param startMonth 1-12 (e.g., 4 for April)
   * @param startYear e.g., 2026
   */
  async generateYearPeriods(
    tenantId: string,
    entityId: string,
    startMonth: number,
    startYear: number,
    userId: string,
  ): Promise<FinancialPeriod[]> {
    const periods: FinancialPeriod[] = [];
    const yearLabel =
      startMonth === 1
        ? `${startYear}`
        : `${startYear}/${(startYear + 1).toString().slice(-2)}`;

    for (let i = 0; i < 12; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1;
      const year = startYear + Math.floor((startMonth - 1 + i) / 12);

      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];

      const period = this.periodRepo.create({
        tenantId,
        entityId,
        name: `${monthNames[month - 1]} ${year}`,
        startDate,
        endDate,
        status: 'OPEN',
        financialYear: yearLabel,
        periodNumber: i + 1,
        createdBy: userId,
        updatedBy: userId,
      });

      periods.push(period);
    }

    return this.periodRepo.save(periods);
  }

  async closePeriod(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<FinancialPeriod> {
    const period = await this.findById(tenantId, entityId, id);

    if (period.status === 'LOCKED') {
      throw new BadRequestException('Cannot close a locked period');
    }

    period.status = 'CLOSED';
    period.closedAt = new Date();
    period.closedBy = userId;
    return this.periodRepo.save(period);
  }

  async lockPeriod(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<FinancialPeriod> {
    const period = await this.findById(tenantId, entityId, id);

    period.status = 'LOCKED';
    period.lockedAt = new Date();
    period.lockedBy = userId;
    return this.periodRepo.save(period);
  }

  async reopenPeriod(
    tenantId: string,
    entityId: string,
    id: string,
  ): Promise<FinancialPeriod> {
    const period = await this.findById(tenantId, entityId, id);

    if (period.status === 'LOCKED') {
      throw new BadRequestException(
        'Locked periods require dual approval to reopen. Use the unlock endpoint.',
      );
    }

    period.status = 'OPEN';
    period.closedAt = null;
    period.closedBy = null;
    return this.periodRepo.save(period);
  }
}
