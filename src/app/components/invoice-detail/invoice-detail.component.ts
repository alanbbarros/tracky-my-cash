import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle } from '../../models/calendar.model';
import { CreditCard } from '../../models/card.model';
import { Transaction, TransactionFilters } from '../../models/transaction.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss'
})
export class InvoiceDetailComponent {
  @Input() cycle: BillingCycle | null = null;
  @Input() card: CreditCard | null = null;
  @Input() transactions: Transaction[] = [];
  @Input() status: 'aberta' | 'fechada' | 'paga' = 'aberta';
  @Output() markAsPaid = new EventEmitter<BillingCycle>();
  @Output() openTransactions = new EventEmitter<TransactionFilters>();
  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  get total(): number {
    return this.transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  get limitPercent(): number {
    if (!this.card || !this.card.limit) {
      return 0;
    }
    return Math.min((this.total / this.card.limit) * 100, 100);
  }

  toFiltersForCycle(): TransactionFilters {
    if (!this.cycle) {
      return {};
    }
    return {
      startDate: this.cycle.cycleStart.toISOString().slice(0, 10),
      endDate: this.cycle.cycleEnd.toISOString().slice(0, 10),
      cardId: this.cycle.cardId
    };
  }
}
