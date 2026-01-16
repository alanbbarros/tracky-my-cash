import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarDay, CalendarMonth } from '../../models/calendar.model';
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
  @Input() focusedMonth: CalendarMonth | null = null;
  @Output() openBudget = new EventEmitter<CalendarMonth>();

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  get selectedDayTitle(): string {
    if (!this.selectedDay) {
      return this.focusedMonth
        ? `Resumo de ${this.focusedMonth.label} ${this.focusedMonth.year}`
        : 'Selecione um mês no calendário';
    }

    return this.selectedDay.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  get budgetStatusLabel(): string {
    if (!this.focusedMonth) {
      return 'Orçamento não selecionado';
    }

    return this.focusedMonth.budgetConfigured ? 'Orçamento configurado' : 'Orçamento não configurado';
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }
}
