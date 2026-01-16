import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CalendarDay } from '../../models/calendar.model';
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

  constructor(private readonly currencyFormat: CurrencyFormatService) {}

  get selectedDayTitle(): string {
    if (!this.selectedDay) {
      return 'Selecione um dia no calendário';
    }

    return this.selectedDay.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatCurrency(value: number): string {
    return this.currencyFormat.format(value);
  }
}
