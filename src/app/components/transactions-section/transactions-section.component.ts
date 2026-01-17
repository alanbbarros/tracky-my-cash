import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from '../../models/card.model';
import { Transaction } from '../../models/transaction.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

interface FilterState {
  startDate: string;
  endDate: string;
  category: string;
  cardId: string;
  text: string;
}

@Component({
  selector: 'app-transactions-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions-section.component.html',
  styleUrl: './transactions-section.component.scss'
})
export class TransactionsSectionComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() cards: Card[] = [];
  @Input() presetFilters: Partial<FilterState> | null = null;
  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();

  filters: FilterState = {
    startDate: '',
    endDate: '',
    category: '',
    cardId: '',
    text: ''
  };

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['presetFilters'] && this.presetFilters) {
      this.filters = {
        ...this.filters,
        ...this.presetFilters
      };
    }
  }

  get filteredTransactions(): Transaction[] {
    return this.transactions
      .filter((transaction) => {
        const matchesText = this.filters.text
          ? transaction.title.toLowerCase().includes(this.filters.text.toLowerCase()) ||
            transaction.category.toLowerCase().includes(this.filters.text.toLowerCase())
          : true;
        const matchesCategory = this.filters.category
          ? transaction.category.toLowerCase().includes(this.filters.category.toLowerCase())
          : true;
        const matchesCard = this.filters.cardId ? transaction.cardId === this.filters.cardId : true;
        const matchesStart = this.filters.startDate ? transaction.date >= this.filters.startDate : true;
        const matchesEnd = this.filters.endDate ? transaction.date <= this.filters.endDate : true;

        return matchesText && matchesCategory && matchesCard && matchesStart && matchesEnd;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  resolveCardName(cardId?: string): string {
    if (!cardId) {
      return '—';
    }
    return this.cards.find((card) => card.id === cardId)?.name ?? '—';
  }

  installmentLabel(transaction: Transaction): string | null {
    if (!transaction.installment) {
      return null;
    }

    return `${transaction.installment.current}/${transaction.installment.total}`;
  }
}
