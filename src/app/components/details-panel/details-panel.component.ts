import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle, CalendarDay } from '../../models/calendar.model';
import { Transaction, TransactionFilters } from '../../models/transaction.model';
import { CurrencyFormatService } from '../../services/currency-format.service';

@Component({
  selector: 'app-details-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-panel.component.html',
  styleUrl: './details-panel.component.scss'
})
export class DetailsPanelComponent {
  @Input() selectedDay: CalendarDay | null = null;
  @Input() focusedCycle: BillingCycle | null = null;
  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() deleteTransaction = new EventEmitter<Transaction>();
  @Output() openTransactions = new EventEmitter<TransactionFilters>();
  @Output() openNewEntry = new EventEmitter<void>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  get selectedDayTitle(): string {
    if (!this.selectedDay) {
      return this.focusedMonth
        ? `Resumo do ciclo ${this.focusedMonth.label} ${this.focusedMonth.year}`
        : 'Selecione um dia no calendário';
    }

    return this.selectedDay.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  get focusedMonth(): BillingCycle | null {
    return this.focusedCycle;
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }

  toFiltersForCycle(): TransactionFilters {
    if (!this.focusedCycle) {
      return {};
    }
    return {
      startDate: this.focusedCycle.cycleStart.toISOString().slice(0, 10),
      endDate: this.focusedCycle.cycleEnd.toISOString().slice(0, 10)
    };
  }
}
