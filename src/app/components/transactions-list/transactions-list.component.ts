import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreditCard } from '../../models/card.model';
import { Transaction, TransactionFilters } from '../../models/transaction.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.scss'
})
export class TransactionsListComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() cards: CreditCard[] = [];
  @Input() filters: TransactionFilters = {};
  @Output() filtersChange = new EventEmitter<TransactionFilters>();
  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() openNewEntry = new EventEmitter<void>();

  form: TransactionFilters = {};

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.form = { ...this.filters };
    }
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  get categories(): string[] {
    return Array.from(new Set(this.transactions.map((transaction) => transaction.category))).sort();
  }

  onFilterChange(): void {
    this.filtersChange.emit({ ...this.form });
  }
}
