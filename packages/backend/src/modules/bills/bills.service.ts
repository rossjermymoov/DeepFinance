import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Bill } from './bill.entity';
import { BillLine } from './bill-line.entity';
import { CreateBillDto, UpdateBillDto, BillQueryDto, RecordPaymentDto } from './bills.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,
    @InjectRepository(BillLine)
    private readonly lineRepo: Repository<BillLine>,
  ) {}

  async generateBillNumber(tenantId: string, entityId: string): Promise<string> {
    const lastBill = await this.billRepo.findOne({
      where: { tenantId, entityId },
      order: { billNumber: 'DESC' },
    });

    if (!lastBill) {
      return 'BIL-000001';
    }

    const number = parseInt(lastBill.billNumber.split('-')[1], 10);
    const nextNumber = (number + 1).toString().padStart(6, '0');
    return `BIL-${nextNumber}`;
  }

  async findAll(
    tenantId: string,
    entityId: string,
    query?: BillQueryDto,
  ): Promise<{ items: Bill[]; total: number }> {
    const queryBuilder = this.billRepo.createQueryBuilder('bill')
      .where('bill.tenantId = :tenantId', { tenantId })
      .andWhere('bill.entityId = :entityId', { entityId });

    if (query?.status) {
      queryBuilder.andWhere('bill.status = :status', { status: query.status });
    }

    if (query?.contactId) {
      queryBuilder.andWhere('bill.contactId = :contactId', {
        contactId: query.contactId,
      });
    }

    if (query?.dateFrom) {
      queryBuilder.andWhere('bill.issueDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query?.dateTo) {
      queryBuilder.andWhere('bill.issueDate <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder
      .orderBy('bill.issueDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findById(
    tenantId: string,
    entityId: string,
    id: string,
  ): Promise<Bill> {
    const bill = await this.billRepo.findOne({
      where: { id, tenantId, entityId },
      relations: ['lines'],
    });

    if (!bill) {
      throw new NotFoundException(`Bill ${id} not found`);
    }

    return bill;
  }

  async create(
    tenantId: string,
    entityId: string,
    dto: CreateBillDto,
    userId: string,
  ): Promise<Bill> {
    const billNumber = await this.generateBillNumber(tenantId, entityId);

    // Calculate totals from lines
    let subtotal = 0;
    let taxTotal = 0;

    const lines = dto.lines.map((lineDto, index) => {
      const lineSubtotal = Number(lineDto.quantity || 1) * Number(lineDto.unitPrice);
      subtotal += lineSubtotal;

      const taxAmount = Number(lineDto.unitPrice) * 0; // Simplified; real impl would use taxRateId
      taxTotal += taxAmount;

      return this.lineRepo.create({
        lineNumber: index + 1,
        description: lineDto.description,
        accountId: lineDto.accountId,
        quantity: lineDto.quantity || 1,
        unitPrice: lineDto.unitPrice,
        taxRateId: lineDto.taxRateId,
        taxAmount,
        lineTotal: lineSubtotal + taxAmount,
      });
    });

    const bill = this.billRepo.create({
      billNumber,
      tenantId,
      entityId,
      contactId: dto.contactId,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      status: 'DRAFT',
      currency: dto.currency || 'GBP',
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
      amountPaid: 0,
      reference: dto.reference,
      notes: dto.notes,
      lines,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.billRepo.save(bill);
  }

  async update(
    tenantId: string,
    entityId: string,
    id: string,
    dto: UpdateBillDto,
    userId: string,
  ): Promise<Bill> {
    const bill = await this.findById(tenantId, entityId, id);

    if (bill.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT bills can be edited');
    }

    if (dto.lines) {
      // Delete old lines
      await this.lineRepo.delete({ billId: id });

      // Recalculate totals
      let subtotal = 0;
      let taxTotal = 0;

      const newLines = dto.lines.map((lineDto, index) => {
        const lineSubtotal = Number(lineDto.quantity || 1) * Number(lineDto.unitPrice);
        subtotal += lineSubtotal;

        const taxAmount = 0;
        taxTotal += taxAmount;

        return this.lineRepo.create({
          billId: id,
          lineNumber: index + 1,
          description: lineDto.description,
          accountId: lineDto.accountId,
          quantity: lineDto.quantity || 1,
          unitPrice: lineDto.unitPrice,
          taxRateId: lineDto.taxRateId,
          taxAmount,
          lineTotal: lineSubtotal + taxAmount,
        });
      });

      bill.lines = await this.lineRepo.save(newLines);
      bill.subtotal = subtotal;
      bill.taxTotal = taxTotal;
      bill.total = subtotal + taxTotal;
    }

    Object.assign(bill, {
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      reference: dto.reference,
      notes: dto.notes,
      updatedBy: userId,
    });

    return this.billRepo.save(bill);
  }

  async approve(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<Bill> {
    const bill = await this.findById(tenantId, entityId, id);

    if (bill.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT bills can be approved');
    }

    bill.status = 'APPROVED';
    bill.updatedBy = userId;

    return this.billRepo.save(bill);
  }

  async recordPayment(
    tenantId: string,
    entityId: string,
    id: string,
    dto: RecordPaymentDto,
    userId: string,
  ): Promise<Bill> {
    const bill = await this.findById(tenantId, entityId, id);

    if (!['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'].includes(bill.status)) {
      throw new BadRequestException(
        'Payment can only be recorded on APPROVED, PARTIALLY_PAID, or OVERDUE bills',
      );
    }

    const newAmountPaid = Number(bill.amountPaid) + Number(dto.amount);

    if (newAmountPaid > Number(bill.total)) {
      throw new BadRequestException('Payment exceeds bill total');
    }

    bill.amountPaid = newAmountPaid;

    if (newAmountPaid === Number(bill.total)) {
      bill.status = 'PAID';
    } else if (newAmountPaid > 0) {
      bill.status = 'PARTIALLY_PAID';
    }

    bill.updatedBy = userId;
    return this.billRepo.save(bill);
  }

  async void(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<Bill> {
    const bill = await this.findById(tenantId, entityId, id);

    if (['PAID', 'VOID'].includes(bill.status)) {
      throw new BadRequestException('Cannot void a PAID or already VOID bill');
    }

    bill.status = 'VOID';
    bill.updatedBy = userId;

    return this.billRepo.save(bill);
  }
}
