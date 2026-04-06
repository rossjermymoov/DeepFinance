import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceLine } from './invoice-line.entity';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryDto, RecordPaymentDto } from './invoices.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine)
    private readonly lineRepo: Repository<InvoiceLine>,
  ) {}

  async generateInvoiceNumber(tenantId: string, entityId: string): Promise<string> {
    const lastInvoice = await this.invoiceRepo.findOne({
      where: { tenantId, entityId },
      order: { invoiceNumber: 'DESC' },
    });

    if (!lastInvoice) {
      return 'INV-000001';
    }

    const number = parseInt(lastInvoice.invoiceNumber.split('-')[1], 10);
    const nextNumber = (number + 1).toString().padStart(6, '0');
    return `INV-${nextNumber}`;
  }

  async findAll(
    tenantId: string,
    entityId: string,
    query?: InvoiceQueryDto,
  ): Promise<{ items: Invoice[]; total: number }> {
    const queryBuilder = this.invoiceRepo.createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.entityId = :entityId', { entityId });

    if (query?.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: query.status });
    }

    if (query?.contactId) {
      queryBuilder.andWhere('invoice.contactId = :contactId', {
        contactId: query.contactId,
      });
    }

    if (query?.dateFrom) {
      queryBuilder.andWhere('invoice.issueDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query?.dateTo) {
      queryBuilder.andWhere('invoice.issueDate <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder
      .orderBy('invoice.issueDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findById(
    tenantId: string,
    entityId: string,
    id: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenantId, entityId },
      relations: ['lines'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  async create(
    tenantId: string,
    entityId: string,
    dto: CreateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId, entityId);

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

    const invoice = this.invoiceRepo.create({
      invoiceNumber,
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

    return this.invoiceRepo.save(invoice);
  }

  async update(
    tenantId: string,
    entityId: string,
    id: string,
    dto: UpdateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(tenantId, entityId, id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be edited');
    }

    if (dto.lines) {
      // Delete old lines
      await this.lineRepo.delete({ invoiceId: id });

      // Recalculate totals
      let subtotal = 0;
      let taxTotal = 0;

      const newLines = dto.lines.map((lineDto, index) => {
        const lineSubtotal = Number(lineDto.quantity || 1) * Number(lineDto.unitPrice);
        subtotal += lineSubtotal;

        const taxAmount = 0;
        taxTotal += taxAmount;

        return this.lineRepo.create({
          invoiceId: id,
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

      invoice.lines = await this.lineRepo.save(newLines);
      invoice.subtotal = subtotal;
      invoice.taxTotal = taxTotal;
      invoice.total = subtotal + taxTotal;
    }

    Object.assign(invoice, {
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      reference: dto.reference,
      notes: dto.notes,
      updatedBy: userId,
    });

    return this.invoiceRepo.save(invoice);
  }

  async approve(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(tenantId, entityId, id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be approved');
    }

    invoice.status = 'SENT';
    invoice.updatedBy = userId;

    return this.invoiceRepo.save(invoice);
  }

  async recordPayment(
    tenantId: string,
    entityId: string,
    id: string,
    dto: RecordPaymentDto,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(tenantId, entityId, id);

    if (!['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
      throw new BadRequestException(
        'Payment can only be recorded on SENT, PARTIALLY_PAID, or OVERDUE invoices',
      );
    }

    const newAmountPaid = Number(invoice.amountPaid) + Number(dto.amount);

    if (newAmountPaid > Number(invoice.total)) {
      throw new BadRequestException('Payment exceeds invoice total');
    }

    invoice.amountPaid = newAmountPaid;

    if (newAmountPaid === Number(invoice.total)) {
      invoice.status = 'PAID';
    } else if (newAmountPaid > 0) {
      invoice.status = 'PARTIALLY_PAID';
    }

    invoice.updatedBy = userId;
    return this.invoiceRepo.save(invoice);
  }

  async void(
    tenantId: string,
    entityId: string,
    id: string,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(tenantId, entityId, id);

    if (['PAID', 'VOID'].includes(invoice.status)) {
      throw new BadRequestException('Cannot void a PAID or already VOID invoice');
    }

    invoice.status = 'VOID';
    invoice.updatedBy = userId;

    return this.invoiceRepo.save(invoice);
  }
}
