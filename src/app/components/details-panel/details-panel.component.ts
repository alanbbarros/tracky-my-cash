import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingCycle, CalendarDay } from '../../models/calendar.model';
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
  @Output() openBudget = new EventEmitter<BillingCycle>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  get selectedDayTitle(): string {
    if (!this.selectedDay) {
      return this.focusedCycle ? `Resumo da ${this.focusedCycle.label}` : 'Selecione uma fatura no calendário';
    }

    return this.selectedDay.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  get budgetStatusLabel(): string {
    if (!this.focusedCycle) {
      return 'Orçamento da fatura não selecionado';
    }

    return this.focusedCycle.budgetConfigured ? 'Orçamento da fatura configurado' : 'Orçamento da fatura não configurado';
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }
}
