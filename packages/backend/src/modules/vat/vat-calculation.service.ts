import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice } from '../invoices/invoice.entity';
import { Bill } from '../bills/bill.entity';
import { VatSettings, VatScheme } from './vat-settings.entity';
import { VatCalculationResult } from './vat.dto';

/**
 * Calculation service for VAT returns.
 * Supports STANDARD, FLAT_RATE, and CASH_ACCOUNTING schemes.
 */
@Injectable()
export class VatCalculationService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,
  ) {}

  /**
   * Calculate a complete 9-box VAT return.
   * Uses pence (bigint) for all monetary amounts.
   */
  async calculateReturn(
    tenantId: string,
    entityId: string,
    periodStart: string,
    periodEnd: string,
    settings: VatSettings,
  ): Promise<VatCalculationResult> {
    if (periodStart >= periodEnd) {
      throw new BadRequestException('Period start must be before period end');
    }

    switch (settings.vatScheme) {
      case VatScheme.STANDARD:
        return this.calculateStandardScheme(
          tenantId,
          entityId,
          periodStart,
          periodEnd,
        );

      case VatScheme.FLAT_RATE:
        return this.calculateFlatRateScheme(
          tenantId,
          entityId,
          periodStart,
          periodEnd,
          settings,
        );

      case VatScheme.CASH_ACCOUNTING:
        return this.calculateCashAccountingScheme(
          tenantId,
          entityId,
          periodStart,
          periodEnd,
        );

      default:
        throw new BadRequestException(`Unknown VAT scheme: ${settings.vatScheme}`);
    }
  }

  /**
   * Standard VAT scheme.
   * Box 1: Output VAT from invoices with invoice date in period
   * Box 4: Input VAT from bills with bill date in period
   * Box 6: Net turnover (invoices ex VAT)
   * Box 7: Net purchases (bills ex VAT)
   * Box 2, 8, 9: 0 (post-Brexit simplification)
   */
  private async calculateStandardScheme(
    tenantId: string,
    entityId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<VatCalculationResult> {
    // Fetch invoices in period
    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        entityId,
        issueDate: Between(periodStart, periodEnd),
      },
    });

    // Fetch bills in period
    const bills = await this.billRepo.find({
      where: {
        tenantId,
        entityId,
        issueDate: Between(periodStart, periodEnd),
      },
    });

    // Box 1: Output VAT from invoices
    const box1 = BigInt(
      invoices.reduce((sum, inv) => sum + (inv.taxTotal || 0), 0) * 100,
    );

    // Box 4: Input VAT from bills
    const box4 = BigInt(
      bills.reduce((sum, bill) => sum + (bill.taxTotal || 0), 0) * 100,
    );

    // Box 2, 8, 9: Always 0 (post-Brexit)
    const box2 = BigInt(0);
    const box8 = BigInt(0);
    const box9 = BigInt(0);

    // Box 3: Total VAT due (box1 + box2)
    const box3 = box1 + box2;

    // Box 5: Net VAT (box3 - box4)
    const box5 = box3 - box4;

    // Box 6: Total sales ex VAT (in pence)
    const box6 = BigInt(
      invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) * 100,
    );

    // Box 7: Total purchases ex VAT (in pence)
    const box7 = BigInt(
      bills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0) * 100,
    );

    return { box1, box2, box3, box4, box5, box6, box7, box8, box9 };
  }

  /**
   * Flat rate scheme.
   * Box 1: Gross turnover (including VAT) × flat rate percentage
   * Box 4: VAT on capital goods over £2000 (simplified: EU acquisition VAT only)
   * Box 6: Gross turnover including VAT
   * Box 7: Total purchases including VAT
   * Box 2, 8, 9: 0 (post-Brexit simplification)
   */
  private async calculateFlatRateScheme(
    tenantId: string,
    entityId: string,
    periodStart: string,
    periodEnd: string,
    settings: VatSettings,
  ): Promise<VatCalculationResult> {
    const flatRate = (settings.flatRatePercentage || 0) / 100;

    // Fetch invoices in period
    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        entityId,
        issueDate: Between(periodStart, periodEnd),
      },
    });

    // Fetch bills in period
    const bills = await this.billRepo.find({
      where: {
        tenantId,
        entityId,
        issueDate: Between(periodStart, periodEnd),
      },
    });

    // Gross turnover (including VAT)
    const grossTurnover = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Box 1: Gross turnover × flat rate (in pence)
    const box1 = BigInt(Math.round(grossTurnover * flatRate * 100));

    // Box 4: Simplified - just VAT from bills (no capital goods calculation here)
    const box4 = BigInt(
      bills.reduce((sum, bill) => sum + (bill.taxTotal || 0), 0) * 100,
    );

    // Box 2, 8, 9: Always 0
    const box2 = BigInt(0);
    const box8 = BigInt(0);
    const box9 = BigInt(0);

    // Box 3: Total VAT due
    const box3 = box1 + box2;

    // Box 5: Net VAT
    const box5 = box3 - box4;

    // Box 6: Gross turnover including VAT (in pence)
    const box6 = BigInt(Math.round(grossTurnover * 100));

    // Box 7: Total purchases including VAT (in pence)
    const box7 = BigInt(
      bills.reduce((sum, bill) => sum + (bill.total || 0), 0) * 100,
    );

    return { box1, box2, box3, box4, box5, box6, box7, box8, box9 };
  }

  /**
   * Cash accounting scheme.
   * Box 1: Output VAT from invoices where payment received in period
   * Box 4: Input VAT from bills where payment made in period
   * Box 6: Net value of sales with payment received
   * Box 7: Net value of purchases with payment made
   * Box 2, 8, 9: 0 (post-Brexit simplification)
   */
  private async calculateCashAccountingScheme(
    tenantId: string,
    entityId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<VatCalculationResult> {
    // For cash accounting, we look at invoices/bills by payment, not issue date
    // Since the data model tracks amountPaid, we assume payments are tracked
    // In a real scenario, we'd need payment history. For now, we use amountPaid > 0.
    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        entityId,
        issueDate: Between(periodStart, periodEnd),
      },
    });

    const bills = await this.billRepo.find({
      where: {
        tenantId,
        entityId,
        issueDate: Between(periodStart, periodEnd),
      },
    });

    // Filter to only those with payments in period
    // (In real implementation, check actual payment dates)
    const paidInvoices = invoices.filter((inv) => (inv.amountPaid || 0) > 0);
    const paidBills = bills.filter((bill) => (bill.amountPaid || 0) > 0);

    // Box 1: Output VAT from paid invoices
    const box1 = BigInt(
      paidInvoices.reduce((sum, inv) => sum + (inv.taxTotal || 0), 0) * 100,
    );

    // Box 4: Input VAT from paid bills
    const box4 = BigInt(
      paidBills.reduce((sum, bill) => sum + (bill.taxTotal || 0), 0) * 100,
    );

    // Box 2, 8, 9: Always 0
    const box2 = BigInt(0);
    const box8 = BigInt(0);
    const box9 = BigInt(0);

    // Box 3: Total VAT due
    const box3 = box1 + box2;

    // Box 5: Net VAT
    const box5 = box3 - box4;

    // Box 6: Net turnover from paid invoices
    const box6 = BigInt(
      paidInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) * 100,
    );

    // Box 7: Net purchases from paid bills
    const box7 = BigInt(
      paidBills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0) * 100,
    );

    return { box1, box2, box3, box4, box5, box6, box7, box8, box9 };
  }
}
