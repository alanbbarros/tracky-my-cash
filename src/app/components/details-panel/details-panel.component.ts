import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle, CalendarDay } from '../../models/calendar.model';
import { Transaction } from '../../models/transaction.model';
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
  @Output() viewCycleTransactions = new EventEmitter<void>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  get selectedDayTitle(): string {
    if (!this.selectedDay) {
      return this.focusedCycle ? `Resumo da ${this.focusedCycle.label}` : 'Selecione um ciclo no calendário';
    }

    return this.selectedDay.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  get cycleStatusLabel(): string {
    if (!this.focusedCycle) {
      return 'Ciclo não selecionado';
    }

    const map = {
      aberta: 'Fatura aberta',
      fechada: 'Fatura fechada',
      paga: 'Fatura paga'
    } as const;

    return map[this.focusedCycle.status];
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
}
