import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle } from '../../models/calendar.model';
import { Card } from '../../models/card.model';
import { Transaction } from '../../models/transaction.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss'
})
export class InvoiceDetailComponent {
  @Input() card: Card | null = null;
  @Input() cycle: BillingCycle | null = null;
  @Input() transactions: Transaction[] = [];
  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() markAsPaid = new EventEmitter<void>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  get creditTransactions(): Transaction[] {
    if (!this.card || !this.cycle) {
      return [];
    }

    const start = this.cycle.startDate;
    const end = this.cycle.endDate;

    return this.transactions
      .filter(
        (transaction) =>
          transaction.paymentMethod === 'credito' &&
          transaction.cardId === this.card?.id &&
          transaction.amount < 0 &&
          !transaction.isInvoicePayment &&
          new Date(transaction.date) >= start &&
          new Date(transaction.date) <= end
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  formatInstallment(transaction: Transaction): string | null {
    if (!transaction.installment) {
      return null;
    }

    return `${transaction.installment.current}/${transaction.installment.total}`;
  }

  get usedLimitPercentage(): number {
    if (!this.card || !this.cycle) {
      return 0;
    }

    return Math.min((this.cycle.creditTotal / this.card.limit) * 100, 100);
  }
}
