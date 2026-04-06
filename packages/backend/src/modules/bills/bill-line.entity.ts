import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  Relation,
} from 'typeorm';
import { Bill } from './bill.entity';

@Entity('bill_lines', { schema: 'core' })
@Index(['billId', 'lineNumber'])
export class BillLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId: string;

  @ManyToOne(() => Bill, (bill) => bill.lines, {
    onDelete: 'CASCADE',
  })
  bill: Relation<Bill>;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 4,
    default: 1,
  })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  unitPrice: number;

  @Column({ name: 'tax_rate_id', type: 'uuid', nullable: true })
  taxRateId: string | null;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'line_total',
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  lineTotal: number;
}
