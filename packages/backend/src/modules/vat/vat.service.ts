import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VatSettings, VatScheme, VatReturnFrequency } from './vat-settings.entity';
import { VatReturn, VatReturnStatus } from './vat-return.entity';
import { VatObligation } from './vat-obligation.entity';
import {
  UpdateVatSettingsDto,
  CalculateVatReturnDto,
  VatReturnQueryDto,
  HmrcSubmitPayload,
} from './vat.dto';
import { VatCalculationService } from './vat-calculation.service';
import { HmrcMtdService } from './hmrc-mtd.service';

/**
 * Main VAT service orchestrating settings, calculations, and HMRC integration.
 */
@Injectable()
export class VatService {
  private readonly logger = new Logger(VatService.name);

  constructor(
    @InjectRepository(VatSettings)
    private readonly settingsRepo: Repository<VatSettings>,
    @InjectRepository(VatReturn)
    private readonly returnRepo: Repository<VatReturn>,
    @InjectRepository(VatObligation)
    private readonly obligationRepo: Repository<VatObligation>,
    private readonly calculationService: VatCalculationService,
    private readonly hmrcMtdService: HmrcMtdService,
  ) {}

  // ======================================
  // VAT Settings Methods
  // ======================================

  /**
   * Get VAT settings for an entity, creating defaults if needed.
   */
  async getSettings(tenantId: string, entityId: string): Promise<VatSettings> {
    let settings = await this.settingsRepo.findOne({
      where: { tenantId, entityId },
    });

    if (!settings) {
      // Create default settings
      settings = this.settingsRepo.create({
        tenantId,
        entityId,
        vatScheme: VatScheme.STANDARD,
        returnFrequency: VatReturnFrequency.QUARTERLY,
        isRegistered: false,
      });
      settings = await this.settingsRepo.save(settings);
    }

    return settings;
  }

  /**
   * Update VAT settings.
   */
  async updateSettings(
    tenantId: string,
    entityId: string,
    dto: UpdateVatSettingsDto,
    userId?: string,
  ): Promise<VatSettings> {
    const settings = await this.getSettings(tenantId, entityId);

    Object.assign(settings, dto, { updatedBy: userId });
    return this.settingsRepo.save(settings);
  }

  /**
   * Link HMRC OAuth tokens to VAT settings (called after successful auth).
   */
  async linkHmrcTokens(
    tenantId: string,
    entityId: string,
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
    userId?: string,
  ): Promise<VatSettings> {
    const settings = await this.getSettings(tenantId, entityId);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    Object.assign(settings, {
      hmrcAccessToken: accessToken,
      hmrcRefreshToken: refreshToken,
      hmrcTokenExpiresAt: expiresAt,
      updatedBy: userId,
    });

    return this.settingsRepo.save(settings);
  }

  /**
   * Update HMRC token if it was refreshed.
   */
  async refreshHmrcToken(
    tenantId: string,
    entityId: string,
    accessToken: string,
    expiresInSeconds: number,
    userId?: string,
  ): Promise<VatSettings> {
    const settings = await this.getSettings(tenantId, entityId);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    Object.assign(settings, {
      hmrcAccessToken: accessToken,
      hmrcTokenExpiresAt: expiresAt,
      updatedBy: userId,
    });

    return this.settingsRepo.save(settings);
  }

  // ======================================
  // VAT Return Methods
  // ======================================

  /**
   * List VAT returns with optional filtering.
   */
  async listReturns(
    tenantId: string,
    entityId: string,
    query?: VatReturnQueryDto,
  ): Promise<VatReturn[]> {
    const qb = this.returnRepo.createQueryBuilder('vat_return')
      .where('vat_return.tenantId = :tenantId', { tenantId })
      .andWhere('vat_return.entityId = :entityId', { entityId });

    if (query?.status) {
      qb.andWhere('vat_return.status = :status', { status: query.status });
    }

    if (query?.periodStartFrom) {
      qb.andWhere('vat_return.periodStart >= :periodStartFrom', {
        periodStartFrom: query.periodStartFrom,
      });
    }

    if (query?.periodEndTo) {
      qb.andWhere('vat_return.periodEnd <= :periodEndTo', {
        periodEndTo: query.periodEndTo,
      });
    }

    return qb.orderBy('vat_return.periodEnd', 'DESC').getMany();
  }

  /**
   * Get a single VAT return.
   */
  async getReturn(tenantId: string, entityId: string, id: string): Promise<VatReturn> {
    const vatReturn = await this.returnRepo.findOne({
      where: { id, tenantId, entityId },
    });

    if (!vatReturn) {
      throw new NotFoundException(`VAT return ${id} not found`);
    }

    return vatReturn;
  }

  /**
   * Calculate a new VAT return (creates CALCULATED status record).
   */
  async calculateReturn(
    tenantId: string,
    entityId: string,
    dto: CalculateVatReturnDto,
    userId?: string,
  ): Promise<VatReturn> {
    const settings = await this.getSettings(tenantId, entityId);

    // Check if return already exists for this period
    const existing = await this.returnRepo.findOne({
      where: {
        tenantId,
        entityId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
      },
    });

    if (existing && existing.status !== VatReturnStatus.DRAFT) {
      throw new BadRequestException(
        `VAT return for this period already exists with status ${existing.status}`,
      );
    }

    // Calculate boxes
    const calculation = await this.calculationService.calculateReturn(
      tenantId,
      entityId,
      dto.periodStart,
      dto.periodEnd,
      settings,
    );

    // Create or update return record
    let vatReturn = existing || this.returnRepo.create();

    Object.assign(vatReturn, {
      tenantId,
      entityId,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      dueDate: this.calculateDueDate(
        dto.periodEnd,
        settings.returnFrequency,
        settings.staggerGroup,
      ),
      status: VatReturnStatus.CALCULATED,
      vatSchemeUsed: settings.vatScheme,
      box1: calculation.box1,
      box2: calculation.box2,
      box3: calculation.box3,
      box4: calculation.box4,
      box5: calculation.box5,
      box6: calculation.box6,
      box7: calculation.box7,
      box8: calculation.box8,
      box9: calculation.box9,
      calculatedAt: new Date(),
      ...(userId ? { createdBy: userId, updatedBy: userId } : {}),
    });

    return this.returnRepo.save(vatReturn);
  }

  /**
   * Recalculate an existing DRAFT return.
   */
  async recalculateReturn(
    tenantId: string,
    entityId: string,
    id: string,
    userId?: string,
  ): Promise<VatReturn> {
    const vatReturn = await this.getReturn(tenantId, entityId, id);

    if (vatReturn.status !== VatReturnStatus.DRAFT && vatReturn.status !== VatReturnStatus.CALCULATED) {
      throw new BadRequestException(
        `Cannot recalculate return with status ${vatReturn.status}`,
      );
    }

    const dto: CalculateVatReturnDto = {
      periodStart: vatReturn.periodStart,
      periodEnd: vatReturn.periodEnd,
    };

    return this.calculateReturn(tenantId, entityId, dto, userId);
  }

  /**
   * Mark a return as reviewed (ready for submission).
   */
  async reviewReturn(
    tenantId: string,
    entityId: string,
    id: string,
    userId?: string,
  ): Promise<VatReturn> {
    const vatReturn = await this.getReturn(tenantId, entityId, id);

    if (vatReturn.status !== VatReturnStatus.CALCULATED) {
      throw new BadRequestException(
        `Can only review returns with status CALCULATED, current status: ${vatReturn.status}`,
      );
    }

    vatReturn.status = VatReturnStatus.REVIEWED;
    if (userId) {
      vatReturn.updatedBy = userId;
    }

    return this.returnRepo.save(vatReturn);
  }

  /**
   * Submit a return to HMRC.
   */
  async submitReturn(
    tenantId: string,
    entityId: string,
    id: string,
    userId?: string,
  ): Promise<VatReturn> {
    const vatReturn = await this.getReturn(tenantId, entityId, id);
    const settings = await this.getSettings(tenantId, entityId);

    if (!settings.isRegistered || !settings.vatNumber) {
      throw new BadRequestException('Entity is not registered for VAT');
    }

    if (vatReturn.status !== VatReturnStatus.REVIEWED) {
      throw new BadRequestException(
        `Can only submit returns with status REVIEWED, current status: ${vatReturn.status}`,
      );
    }

    // Build HMRC payload (convert pence to pounds)
    const periodKey = this.generatePeriodKey(vatReturn.periodStart, vatReturn.periodEnd);
    const payload: HmrcSubmitPayload = {
      periodKey,
      vatDueSales: Number(vatReturn.box1) / 100,
      vatDueAcquisitions: Number(vatReturn.box2) / 100,
      totalVatDue: Number(vatReturn.box3) / 100,
      vatReclaimedCurrPeriod: Number(vatReturn.box4) / 100,
      netVatDue: Math.abs(Number(vatReturn.box5)) / 100,
      totalValueSalesExVAT: Math.floor(Number(vatReturn.box6) / 100),
      totalValuePurchasesExVAT: Math.floor(Number(vatReturn.box7) / 100),
      totalValueGoodsSuppliedExVAT: Math.floor(Number(vatReturn.box8) / 100),
      totalAcquisitionsExVAT: Math.floor(Number(vatReturn.box9) / 100),
      finalised: true,
    };

    try {
      // Refresh token if needed
      const validSettings = { ...settings };
      if (validSettings.hmrcTokenExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(validSettings.hmrcTokenExpiresAt);
        const bufferMs = 5 * 60 * 1000;

        if (now.getTime() + bufferMs >= expiresAt.getTime()) {
          const refreshed = await this.hmrcMtdService.refreshAccessToken(validSettings);
          await this.refreshHmrcToken(
            tenantId,
            entityId,
            refreshed.accessToken,
            refreshed.expiresIn,
            userId,
          );
          validSettings.hmrcAccessToken = refreshed.accessToken;
        }
      }

      // Submit to HMRC
      const result = await this.hmrcMtdService.submitReturn(validSettings, payload);

      vatReturn.status = VatReturnStatus.SUBMITTED;
      vatReturn.submittedAt = new Date();
      vatReturn.hmrcCorrelationId = result.correlationId;
      vatReturn.hmrcReceiptId = result.receiptId || null;
      vatReturn.submissionPayload = payload;
      vatReturn.responsePayload = result;
      if (userId) {
        vatReturn.updatedBy = userId;
      }

      return this.returnRepo.save(vatReturn);
    } catch (error) {
      this.logger.error('Failed to submit VAT return:', error);
      vatReturn.responsePayload = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (userId) {
        vatReturn.updatedBy = userId;
      }
      await this.returnRepo.save(vatReturn);
      throw error;
    }
  }

  // ======================================
  // VAT Obligations Methods
  // ======================================

  /**
   * List VAT obligations.
   */
  async listObligations(tenantId: string, entityId: string): Promise<VatObligation[]> {
    return this.obligationRepo.find({
      where: { tenantId, entityId },
      order: { dueDate: 'DESC' },
    });
  }

  /**
   * Sync VAT obligations from HMRC.
   */
  async syncObligations(
    tenantId: string,
    entityId: string,
    userId?: string,
  ): Promise<VatObligation[]> {
    const settings = await this.getSettings(tenantId, entityId);

    if (!settings.isRegistered || !settings.vatNumber) {
      throw new BadRequestException('Entity is not registered for VAT');
    }

    try {
      // Fetch next 2 years of obligations
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];
      const toDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
        .toISOString()
        .split('T')[0];

      const hmrcObligations = await this.hmrcMtdService.getObligations(
        settings,
        fromDate,
        toDate,
      );

      // Upsert obligations
      const saved: VatObligation[] = [];
      for (const hmrcObl of hmrcObligations) {
        let obligation = await this.obligationRepo.findOne({
          where: {
            tenantId,
            entityId,
            periodStart: hmrcObl.start,
            periodEnd: hmrcObl.end,
          },
        });

        if (!obligation) {
          obligation = this.obligationRepo.create();
        }

        Object.assign(obligation, {
          tenantId,
          entityId,
          periodStart: hmrcObl.start,
          periodEnd: hmrcObl.end,
          dueDate: hmrcObl.due,
          status: hmrcObl.status === 'O' ? 'OPEN' : 'FULFILLED',
          hmrcPeriodKey: hmrcObl.periodKey,
          receivedDate: hmrcObl.received || null,
          updatedBy: userId,
        });

        saved.push(await this.obligationRepo.save(obligation));
      }

      // Update last synced
      settings.lastSyncedAt = new Date();
      if (userId) {
        settings.updatedBy = userId;
      }
      await this.settingsRepo.save(settings);

      return saved;
    } catch (error) {
      this.logger.error('Failed to sync obligations:', error);
      throw error;
    }
  }

  // ======================================
  // Helper Methods
  // ======================================

  /**
   * Calculate the due date based on period end and return frequency.
   */
  private calculateDueDate(
    periodEnd: string,
    frequency: VatReturnFrequency,
    staggerGroup?: number | null,
  ): string {
    const endDate = new Date(periodEnd);

    // Standard: returns due 1 month after period end
    let dueDate = new Date(endDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    // UK VAT returns are due on the last day of the month, 9th of following month for paper
    // API requires submission by 9th of next month
    dueDate.setDate(9);

    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Generate HMRC period key from period dates.
   * Format: YYYY-MM (quarter) e.g. "2026Q1" for Jan-Mar
   */
  private generatePeriodKey(periodStart: string, periodEnd: string): string {
    const startDate = new Date(periodStart);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1; // 1-12

    // Determine quarter
    let quarter = 1;
    if (month > 9) quarter = 4;
    else if (month > 6) quarter = 3;
    else if (month > 3) quarter = 2;

    return `${year}Q${quarter}`;
  }
}
